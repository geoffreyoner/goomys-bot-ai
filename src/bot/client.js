import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
        ]
    });
    client.commands = new Collection();
    return client;
}

async function loadFromDir(client, dir, { recursive = false } = {}) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.js')) {
            const mod = await import(pathToFileURL(join(dir, entry.name)).href);
            if (mod.data && mod.execute) {
                client.commands.set(mod.data.name, mod);
            }
        } else if (recursive && entry.isDirectory()) {
            await loadFromDir(client, join(dir, entry.name), { recursive });
        }
    }
}

export async function loadCommands(client) {
    const commandsDir = join(__dirname, 'commands');
    await loadFromDir(client, commandsDir, { recursive: true });
    return client.commands;
}

export async function loadEvents(client) {
    const eventsDir = join(__dirname, 'events');
    const files = readdirSync(eventsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const mod = await import(pathToFileURL(join(eventsDir, file)).href);
        if (mod.name && mod.execute) {
            if (mod.once) {
                client.once(mod.name, (...args) => mod.execute(...args));
            } else {
                client.on(mod.name, (...args) => mod.execute(...args));
            }
        }
    }
}