import { Events } from 'discord.js';
import { deleteGuild } from '../../database/repositories/guildRepo.js';
import { logger } from '../../services/logger.js';

export const name = Events.GuildDelete;

export function execute(guild) {
    deleteGuild(guild.id);
    logger.info({ event: 'guild_left', guildId: guild.id });
}