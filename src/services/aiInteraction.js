import { memoryManager } from '../conversation/manager.js';
import { AIManager } from '../ai/manager.js';
import { buildSystemPrompt } from '../ai/prompt.js';
import { getGuildSettings } from '../database/repositories/guildRepo.js';
import { getUserSettings } from '../database/repositories/userRepo.js';
import { countUserRequestsToday } from '../database/repositories/usageRepo.js';
import { checkCooldown, markRequest, canStartRequest, incrementActive, decrementActive } from '../middleware/rateLimiter.js';
import { validatePrompt } from '../middleware/validator.js';
import { trackUsage } from './usageTracker.js';
import { logger } from './logger.js';
import { env } from '../config/env.js';
import { splitMessage } from '../utils/splitter.js';
import { createAIEmbed } from '../utils/embeds.js';

const aiManager = new AIManager();

async function sendReply(replyTarget, payload) {
    if (typeof replyTarget.editReply === 'function') {
        if (replyTarget.deferred || replyTarget.replied) {
            return replyTarget.editReply(payload);
        }
        return replyTarget.reply(payload);
    }
    if (typeof replyTarget.reply === 'function') {
        return replyTarget.reply(payload);
    }
    throw new Error('Reply target tidak didukung');
}

async function sendError(replyTarget, content) {
    const payload = { content };
    try {
        if (typeof replyTarget.editReply === 'function') {
            if (replyTarget.deferred || replyTarget.replied) {
                await replyTarget.editReply({ content, embeds: [] });
            } else {
                await replyTarget.reply({ content, ephemeral: true });
            }
            return;
        }
        if (typeof replyTarget.reply === 'function') {
            await replyTarget.reply(payload);
        }
    } catch (err) {
        logger.warn({ event: 'send_error_failed', message: err.message });
    }
}

async function sendFollowUp(replyTarget, payload) {
    if (typeof replyTarget.followUp === 'function') {
        return replyTarget.followUp(payload);
    }
    if (replyTarget.channel?.send) {
        return replyTarget.channel.send(payload);
    }
}

export async function handleAIInteraction({ source, userId, guildId, channelId, prompt, replyTarget, overrideModel, overrideProvider }) {
    try {
        validatePrompt(prompt);
    } catch (err) {
        return sendError(replyTarget, err.message);
    }

    const cooldown = checkCooldown(userId);
    if (!cooldown.allowed) {
        return sendError(replyTarget, `Tunggu ${Math.ceil(cooldown.retryAfterMs / 1000)} detik sebelum request lagi`);
    }

    if (!canStartRequest(userId)) {
        return sendError(replyTarget, 'Masih ada request yang diproses, coba lagi sebentar');
    }

    if (env.DAILY_REQUEST_LIMIT > 0) {
        const today = countUserRequestsToday(userId);
        if (today >= env.DAILY_REQUEST_LIMIT) {
            return sendError(replyTarget, `Batas harian tercapai (${env.DAILY_REQUEST_LIMIT} request/hari)`);
        }
    }

    const guildSettings = guildId ? getGuildSettings(guildId) : null;
    
    if (guildSettings?.maintenance === 1) {
        return sendError(replyTarget, 'AI chat sedang dalam maintenance di server ini');
    }

    if (guildSettings?.ai_channel_id && channelId !== guildSettings.ai_channel_id) {
        const isInteraction = typeof source.isChatInputCommand === 'function' && source.isChatInputCommand();
        if (isInteraction) {
            return sendError(replyTarget, `Bot hanya bisa digunakan di <#${guildSettings.ai_channel_id}>`);
        }
        return;
    }

    markRequest(userId);
    incrementActive(userId);

    const userSettings = getUserSettings(userId);

    const providerName = overrideProvider || userSettings?.preferred_provider || guildSettings?.default_provider || env.DEFAULT_PROVIDER;
    const model = overrideModel || userSettings?.preferred_model || guildSettings?.default_model || env.DEFAULT_MODEL;
    const systemPrompt = buildSystemPrompt(guildSettings?.system_prompt);

    const conversation = memoryManager.getOrCreate({ userId, guildId: guildId ?? null, channelId: channelId ?? null, model });
    memoryManager.record(conversation.id, 'user', prompt);
    const history = memoryManager.history(conversation.id);

    if (source.channel?.sendTyping) {
        try { await source.channel.sendTyping(); } catch { }
    }

    const start = Date.now();
    let fullText = '';
    let lastEditTime = Date.now();
    let message = null;
    let hasStreamed = false;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let finalLatency = 0;
    let activeModel = model;

    const updateStream = async (force = false) => {
        if (!force && Date.now() - lastEditTime < 1500) return;
        if (fullText.length > 3900) return;

        const textToShow = fullText.slice(0, 3900);
        const embed = createAIEmbed({
            description: textToShow + (fullText.length > 3900 ? '...' : ''),
            model: activeModel
        });

        try {
            if (!message) {
                message = await sendReply(replyTarget, { embeds: [embed] });
                hasStreamed = true;
            } else {
                await message.edit({ embeds: [embed] });
            }
        } catch (e) { }
        
        lastEditTime = Date.now();
    };

    try {
        const stream = aiManager.streamChat({ providerName, model, messages: history, systemPrompt });

        for await (const chunk of stream) {
            if (chunk.text) {
                fullText += chunk.text;
                await updateStream();
            }
            if (chunk.usage) {
                totalPromptTokens = chunk.usage.promptTokens || totalPromptTokens;
                totalCompletionTokens = chunk.usage.completionTokens || totalCompletionTokens;
            }
            if (chunk.latencyMs) {
                finalLatency = chunk.latencyMs;
            }
            if (chunk.model) {
                activeModel = chunk.model;
            }
        }

        if (!fullText) {
            throw new Error('AI tidak mengembalikan teks');
        }

        memoryManager.record(conversation.id, 'assistant', fullText, totalCompletionTokens);
        memoryManager.prune(conversation.id);

        const chunks = splitMessage(fullText, 4000);
        for (let i = 0; i < chunks.length; i++) {
            const embed = createAIEmbed({
                description: chunks[i],
                model: activeModel,
                latencyMs: i === 0 ? (finalLatency || (Date.now() - start)) : undefined
            });

            if (i === 0) {
                if (hasStreamed && message) {
                    await message.edit({ embeds: [embed] }).catch(() => {});
                } else {
                    await sendReply(replyTarget, { embeds: [embed] });
                }
            } else {
                await sendFollowUp(replyTarget, { embeds: [embed] });
            }
        }

        trackUsage({
            userId, guildId, provider: providerName, model: activeModel,
            promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens,
            latencyMs: finalLatency || (Date.now() - start), status: 'success'
        });

        logger.info({ event: 'interaction_complete', userId, guildId, provider: providerName, model: activeModel, latencyMs: finalLatency || (Date.now() - start) });

    } catch (err) {
        const latencyMs = Date.now() - start;
        trackUsage({ userId, guildId, provider: providerName, model: activeModel, latencyMs, status: 'error', errorCode: err.message });
        logger.error({ event: 'interaction_failed', userId, guildId, provider: providerName, message: err.message });
        await sendError(replyTarget, err.message);
    } finally {
        decrementActive(userId);
    }
}