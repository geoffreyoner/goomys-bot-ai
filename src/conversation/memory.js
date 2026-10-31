import { env } from '../config/env.js';
import {
    getOrCreateConversation,
    touchConversation
} from '../database/repositories/conversationRepo.js';
import {
    addMessage,
    getHistory,
    clearHistory,
    countMessages,
    pruneOldMessages
} from '../database/repositories/messageRepo.js';

export class MemoryManager {
    getOrCreate(params) {
        return getOrCreateConversation(params);
    }

    record(conversationId, role, content, tokens = null) {
        addMessage(conversationId, role, content, tokens);
        touchConversation(conversationId);
    }

    history(conversationId, limit = env.MAX_HISTORY_MESSAGES) {
        return getHistory(conversationId, limit);
    }

    clear(conversationId) {
        clearHistory(conversationId);
    }

    prune(conversationId) {
        return pruneOldMessages(conversationId, env.MAX_HISTORY_MESSAGES);
    }

    status(conversationId) {
        return {
            messageCount: countMessages(conversationId)
        };
    }
}