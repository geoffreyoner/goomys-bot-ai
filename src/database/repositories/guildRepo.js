import { db } from '../connection.js';

export function getGuildSettings(guildId) {
    if (!guildId) return null;
    return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) || null;
}

export function ensureGuild(guildId) {
    const existing = getGuildSettings(guildId);
    if (existing) return existing;
    db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
    return getGuildSettings(guildId);
}

export function setDefaultModel(guildId, model, provider) {
    ensureGuild(guildId);
    db.prepare('UPDATE guild_settings SET default_model = ?, default_provider = ?, updated_at = unixepoch() WHERE guild_id = ?')
        .run(model, provider, guildId);
    return getGuildSettings(guildId);
}

export function setSystemPrompt(guildId, prompt) {
    ensureGuild(guildId);
    db.prepare('UPDATE guild_settings SET system_prompt = ?, updated_at = unixepoch() WHERE guild_id = ?')
        .run(prompt, guildId);
    return getGuildSettings(guildId);
}

export function setAiChannel(guildId, channelId) {
    ensureGuild(guildId);
    db.prepare('UPDATE guild_settings SET ai_channel_id = ?, updated_at = unixepoch() WHERE guild_id = ?')
        .run(channelId, guildId);
    return getGuildSettings(guildId);
}

export function setMaintenance(guildId, enabled) {
    ensureGuild(guildId);
    db.prepare('UPDATE guild_settings SET maintenance = ?, updated_at = unixepoch() WHERE guild_id = ?')
        .run(enabled ? 1 : 0, guildId);
    return getGuildSettings(guildId);
}

export function deleteGuild(guildId) {
    db.prepare('DELETE FROM guild_settings WHERE guild_id = ?').run(guildId);
}