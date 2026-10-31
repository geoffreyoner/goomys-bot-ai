import { Events } from 'discord.js';
import { handleAIInteraction } from '../../services/aiInteraction.js';

export const name = Events.MessageCreate;

export async function execute(message) {
    if (message.author.bot) return;
    if (!message.client.user) return;

    const isMention = message.mentions.has(message.client.user.id);

    let isReplyToBot = false;
    if (message.reference) {
        try {
            const ref = await message.fetchReference();
            isReplyToBot = ref.author?.id === message.client.user.id;
        } catch {
            isReplyToBot = false;
        }
    }

    if (!isMention && !isReplyToBot) return;

    const prompt = message.content
        .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
        .trim();

    if (!prompt) return;

    await handleAIInteraction({
        source: message,
        userId: message.author.id,
        guildId: message.guildId,
        channelId: message.channelId,
        prompt,
        replyTarget: message
    });
}