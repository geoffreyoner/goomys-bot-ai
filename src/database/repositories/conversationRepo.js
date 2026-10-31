import { db } from '../connection.js';

export function getOrCreateConversation({ userId, guildId, channelId, model }) {
    const existing = db.prepare(`
        SELECT * FROM conversations
        WHERE user_id = ? AND guild_id IS ? AND channel_id IS ?
        ORDER BY updated_at DESC LIMIT 1
    `).get(userId, guildId ?? null, channelId ?? null);

    if (existing) return existing;

    const info = db.prepare(`
        INSERT INTO conversations (user_id, guild_id, channel_id, model)
        VALUES (?, ?, ?, ?)
    `).run(userId, guildId ?? null, channelId ?? null, model ?? null);

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(info.lastInsertRowid);
}

export function getConversationById(id) {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) || null;
}

export function touchConversation(id) {
    db.prepare('UPDATE conversations SET updated_at = unixepoch() WHERE id = ?').run(id);
}