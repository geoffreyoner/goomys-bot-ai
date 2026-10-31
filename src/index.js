import { env } from './config/env.js';
import { logger } from './services/logger.js';
import { createClient, loadCommands, loadEvents } from './bot/client.js';

const client = createClient();

await loadCommands(client);
await loadEvents(client);

process.on('unhandledRejection', err => {
    logger.error({ event: 'unhandled_rejection', message: err?.message ?? String(err) });
});

process.on('uncaughtException', err => {
    logger.error({ event: 'uncaught_exception', message: err.message });
});

process.on('SIGINT', () => {
    logger.info({ event: 'shutdown', reason: 'SIGINT' });
    client.destroy();
    process.exit(0);
});

logger.info({
    event: 'starting',
    providers: env.availableProviders,
    defaultProvider: env.DEFAULT_PROVIDER,
    defaultModel: env.DEFAULT_MODEL
});

await client.login(env.DISCORD_TOKEN);