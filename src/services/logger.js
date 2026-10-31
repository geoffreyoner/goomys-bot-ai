import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    redact: {
        paths: ['*.apiKey', '*.token', '*.password', 'req.headers.authorization'],
        censor: '[REDACTED]'
    }
});