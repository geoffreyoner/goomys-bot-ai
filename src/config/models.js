export const PROVIDER_MODELS = {
    gemini: [
        'gemini-3.8-flash', 
        'gemini-3.5-flash-lite', 
        'gemini-3.5-flash'
    ],
    openai: [
        'gpt-4.1', 
        'gpt-4.1-mini', 
        'gpt-4.1-nano', 
        'gpt-4o'
    ],
    deepseek: [
        'deepseek-v4-flash', 
        'deepseek-chat', 
        'deepseek-reasoner'
    ],
    openrouter: [
        'anthropic/claude-opus-5.5', 
        'anthropic/claude-haiku-4.5', 
        'meta-llama/llama-4-maverick', 
        'google/gemini-3.1-flash-lite'
    ],
    groq: [
        'openai/gpt-oss-120b', 
        'llama-3.3-70b-versatile', 
        'llama-3.1-8b-instant', 
        'openai/gpt-oss-20b'
    ],
    custom: []
};

export function getModelsForProvider(provider) {
    return PROVIDER_MODELS[provider] ?? [];
}

export function isValidModel(provider, model) {
    const list = PROVIDER_MODELS[provider];
    if (!list) return false;
    if (list.length === 0) return true;
    return list.includes(model);
}