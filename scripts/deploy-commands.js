import { REST, Routes } from 'discord.js';
import { createClient, loadCommands } from '../src/bot/client.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/services/logger.js';

const client = createClient();
await loadCommands(client);

const payload = [...client.commands.values()].map(cmd => cmd.data.toJSON());
const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

try {
    if (env.DISCORD_GUILD_ID) {
        await rest.put(
            Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
            { body: payload }
        );
        logger.info({ event: 'deploy_commands', scope: 'guild', count: payload.length });
    } else {
        await rest.put(
            Routes.applicationCommands(env.DISCORD_CLIENT_ID),
            { body: payload }
        );
        logger.info({ event: 'deploy_commands', scope: 'global', count: payload.length });
    }
} catch (err) {
    logger.error({ event: 'deploy_commands_failed', message: err.message });
    process.exit(1);
}

process.exit(0);