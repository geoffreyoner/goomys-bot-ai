import { createProvider } from './providers/index.js';
import { logger } from '../services/logger.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export class AIManager {
    constructor() {
        this.cache = new Map();
    }

    getProvider(name) {
        if (!this.cache.has(name)) {
            this.cache.set(name, createProvider(name));
        }
        return this.cache.get(name);
    }

    async chat({ providerName, model, messages, systemPrompt, maxRetries = 2 }) {
        const provider = this.getProvider(providerName);
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const controller = new AbortController();
            const timeoutHandle = setTimeout(() => controller.abort(), provider.timeout);
            const start = Date.now();

            try {
                const result = await provider.chat({
                    messages, model, systemPrompt, signal: controller.signal
                });
                clearTimeout(timeoutHandle);

                return {
                    ...result,
                    latencyMs: Date.now() - start,
                    provider: providerName,
                    model: model || provider.defaultModel
                };
            } catch (err) {
                clearTimeout(timeoutHandle);
                lastError = err;
                const isRateLimit = err.status === 429;
                const isTimeout = err.name === 'AbortError' || err.code === 'ETIMEDOUT';

                logger.warn({ event: 'ai_request_failed', provider: providerName, attempt: attempt + 1, status: err.status ?? null, isRateLimit, isTimeout, message: err.message });

                if (isRateLimit && attempt < maxRetries) {
                    const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 8000);
                    await sleep(delay);
                    continue;
                }

                if (!isRateLimit || attempt === maxRetries) {
                    throw this.normalizeError(err, providerName);
                }
            }
        }
        throw this.normalizeError(lastError, providerName);
    }

    async *streamChat({ providerName, model, messages, systemPrompt }) {
        const provider = this.getProvider(providerName);
        const start = Date.now();

        try {
            const stream = provider.streamChat({ messages, model, systemPrompt });
            let finalUsage = null;

            for await (const chunk of stream) {
                if (chunk.usage) {
                    finalUsage = chunk.usage;
                }
                if (chunk.text) {
                    yield { text: chunk.text };
                }
            }
            
            yield { 
                usage: finalUsage, 
                latencyMs: Date.now() - start,
                model: model || provider.defaultModel
            };
        } catch (err) {
            throw this.normalizeError(err, providerName);
        }
    }

    normalizeError(err, providerName) {
        if (err.status === 401 || err.status === 403) {
            return new Error(`API key untuk provider "${providerName}" tidak valid`);
        }
        if (err.status === 429) {
            return new Error(`Provider "${providerName}" sedang rate-limited, coba lagi nanti`);
        }
        if (err.status >= 500) {
            return new Error(`Provider "${providerName}" sedang mengalami gangguan`);
        }
        if (err.name === 'AbortError') {
            return new Error(`Request ke "${providerName}" timeout`);
        }
        return new Error(`Gagal menghubungi "${providerName}": ${err.message}`);
    }
}