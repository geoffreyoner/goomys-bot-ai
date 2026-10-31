import { Events } from 'discord.js';
import { logger } from '../../services/logger.js';

export const name = Events.ClientReady;
export const once = true;

export function execute(client) {
    logger.info({
        event: 'client_ready',
        tag: client.user.tag,
        guilds: client.guilds.cache.size
    });
}