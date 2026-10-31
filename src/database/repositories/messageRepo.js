import { db } from '../connection.js';

export function addMessage(conversationId, role, content, tokenCount = null) {
    db.prepare(`
        INSERT INTO messages (conversation_id, role, content, token_count)
        VALUES (?, ?, ?, ?)
    `).run(conversationId, role, content, tokenCount);
}

export function getHistory(conversationId, limit) {
    const rows = db.prepare(`
        SELECT role, content FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC LIMIT ?
    `).all(conversationId, limit);
    return rows.reverse();
}

export function clearHistory(conversationId) {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
}

export function countMessages(conversationId) {
    return db.prepare('SELECT COUNT(*) AS c FROM messages WHERE conversation_id = ?')
        .get(conversationId).c;
}

export function pruneOldMessages(conversationId, keep) {
    const total = countMessages(conversationId);
    if (total <= keep) return 0;
    const excess = total - keep;
    const result = db.prepare(`
        DELETE FROM messages WHERE id IN (
            SELECT id FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC LIMIT ?
        )
    `).run(conversationId, excess);
    return result.changes;
}