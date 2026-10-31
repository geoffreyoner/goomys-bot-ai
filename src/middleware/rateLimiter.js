import { env } from '../config/env.js';

const lastRequestAt = new Map();
const activeByUser = new Map();

export function checkCooldown(userId) {
    const last = lastRequestAt.get(userId) ?? 0;
    const remaining = env.USER_COOLDOWN * 1000 - (Date.now() - last);
    if (remaining > 0) {
        return { allowed: false, retryAfterMs: remaining };
    }
    return { allowed: true, retryAfterMs: 0 };
}

export function markRequest(userId) {
    lastRequestAt.set(userId, Date.now());
}

export function canStartRequest(userId) {
    return (activeByUser.get(userId) ?? 0) < env.MAX_CONCURRENT_REQUESTS;
}

export function incrementActive(userId) {
    activeByUser.set(userId, (activeByUser.get(userId) ?? 0) + 1);
}

export function decrementActive(userId) {
    const next = Math.max(0, (activeByUser.get(userId) ?? 1) - 1);
    if (next === 0) activeByUser.delete(userId);
    else activeByUser.set(userId, next);
}