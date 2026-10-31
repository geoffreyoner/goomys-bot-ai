import { Events } from 'discord.js';
import { logger } from '../../services/logger.js';

export const name = Events.Error;

export function execute(err) {
    logger.error({ event: 'client_error', message: err.message });
}