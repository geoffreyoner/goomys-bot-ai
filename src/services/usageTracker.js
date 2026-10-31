import { logUsage } from '../database/repositories/usageRepo.js';
import { logger } from './logger.js';

export function trackUsage(entry) {
    try {
        logUsage(entry);
    } catch (err) {
        logger.warn({ event: 'usage_log_failed', message: err.message });
    }
}