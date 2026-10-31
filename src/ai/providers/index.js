import { GeminiProvider } from './gemini.js';
import { OpenAICompatibleProvider } from './openaiCompatible.js';
import { env } from '../../config/env.js';

const registry = {
    gemini: () => env.GEMINI_API_KEY && new GeminiProvider({
        apiKey: env.GEMINI_API_KEY,
        timeout: env.REQUEST_TIMEOUT
    }),
    openai: () => env.OPENAI_API_KEY && new OpenAICompatibleProvider({
        name: 'openai',
        apiKey: env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        timeout: env.REQUEST_TIMEOUT
    }),
    deepseek: () => env.DEEPSEEK_API_KEY && new OpenAICompatibleProvider({
        name: 'deepseek',
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        timeout: env.REQUEST_TIMEOUT
    }),
    openrouter: () => env.OPENROUTER_API_KEY && new OpenAICompatibleProvider({
        name: 'openrouter',
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultModel: 'google/gemini-3.1-flash-lite',
        timeout: env.REQUEST_TIMEOUT
    }),
    groq: () => env.GROQ_API_KEY && new OpenAICompatibleProvider({
        name: 'groq',
        apiKey: env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        defaultModel: 'openai/gpt-oss-20b',
        timeout: env.REQUEST_TIMEOUT
    }),
    custom: () => env.CUSTOM_API_KEY && env.CUSTOM_BASE_URL && new OpenAICompatibleProvider({
        name: 'custom',
        apiKey: env.CUSTOM_API_KEY,
        baseURL: env.CUSTOM_BASE_URL,
        defaultModel: env.DEFAULT_MODEL,
        timeout: env.REQUEST_TIMEOUT
    })
};

export function createProvider(name) {
    const factory = registry[name];
    if (!factory) throw new Error(`Provider "${name}" tidak dikenal`);
    const instance = factory();
    if (!instance) throw new Error(`Provider "${name}" tidak dikonfigurasi (API key kosong)`);
    return instance;
}

export function listAvailableProviders() {
    return Object.keys(registry).filter(name => {
        try {
            return Boolean(registry[name]());
        } catch {
            return false;
        }
    });
}