import { db } from '../connection.js';

export function logUsage(entry) {
    db.prepare(`
        INSERT INTO usage_logs
            (user_id, guild_id, provider, model, prompt_tokens, completion_tokens,
             latency_ms, status, error_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        entry.userId ?? null,
        entry.guildId ?? null,
        entry.provider ?? null,
        entry.model ?? null,
        entry.promptTokens ?? 0,
        entry.completionTokens ?? 0,
        entry.latencyMs ?? 0,
        entry.status ?? 'success',
        entry.errorCode ?? null
    );
}

export function countUserRequestsToday(userId) {
    return db.prepare(`
        SELECT COUNT(*) AS c FROM usage_logs
        WHERE user_id = ? AND status = 'success'
          AND created_at >= unixepoch('now', 'start of day')
    `).get(userId).c;
}

export function getGuildStats(guildId) {
    const row = db.prepare(`
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors,
            SUM(prompt_tokens + completion_tokens) AS tokens,
            AVG(latency_ms) AS avg_latency
        FROM usage_logs
        WHERE guild_id = ?
    `).get(guildId);
    return {
        total: row.total ?? 0,
        success: row.success ?? 0,
        errors: row.errors ?? 0,
        tokens: row.tokens ?? 0,
        avgLatency: Math.round(row.avg_latency ?? 0)
    };
}