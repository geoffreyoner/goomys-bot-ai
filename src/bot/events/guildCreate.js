import { Events } from 'discord.js';
import { ensureGuild } from '../../database/repositories/guildRepo.js';
import { logger } from '../../services/logger.js';

export const name = Events.GuildCreate;

export function execute(guild) {
    ensureGuild(guild.id);
    logger.info({ event: 'guild_joined', guildId: guild.id, name: guild.name });
}