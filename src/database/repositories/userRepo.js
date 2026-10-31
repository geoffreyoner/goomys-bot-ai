import { db } from '../connection.js';

export function getUserSettings(userId) {
    return db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) || null;
}

export function setPreferredModel(userId, model, provider) {
    db.prepare(`
        INSERT INTO user_settings (user_id, preferred_model, preferred_provider)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            preferred_model = excluded.preferred_model,
            preferred_provider = excluded.preferred_provider
    `).run(userId, model, provider);
    return getUserSettings(userId);
}