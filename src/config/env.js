import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_GUILD_ID: z.string().optional(),
    DEFAULT_PROVIDER: z.enum(['gemini', 'openai', 'deepseek', 'openrouter', 'groq', 'custom']).default('gemini'),
    DEFAULT_MODEL: z.string().min(1),
    GEMINI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    CUSTOM_BASE_URL: z.string().url().optional().or(z.literal('')),
    CUSTOM_API_KEY: z.string().optional(),
    DATABASE_PATH: z.string().default('./data/goomys.sqlite'),
    MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().default(20),
    MAX_CONCURRENT_REQUESTS: z.coerce.number().int().positive().default(5),
    USER_COOLDOWN: z.coerce.number().int().nonnegative().default(5),
    REQUEST_TIMEOUT: z.coerce.number().int().positive().default(60000),
    DAILY_REQUEST_LIMIT: z.coerce.number().int().nonnegative().default(100),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('Environment validation failed');
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    process.exit(1);
}

const keyMap = {
    gemini: 'GEMINI_API_KEY',
    openai: 'OPENAI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    groq: 'GROQ_API_KEY',
    custom: 'CUSTOM_API_KEY'
};

const availableProviders = Object.keys(keyMap).filter(p => Boolean(parsed.data[keyMap[p]]));
if (availableProviders.length === 0) {
    console.error('Tidak ada API key provider yang dikonfigurasi');
    process.exit(1);
}

export const env = { ...parsed.data, availableProviders };