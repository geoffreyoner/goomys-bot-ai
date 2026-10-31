import OpenAI from 'openai';
import { BaseProvider } from './base.js';

export class OpenAICompatibleProvider extends BaseProvider {
    constructor({ name, apiKey, baseURL, defaultModel, timeout }) {
        super({ apiKey, baseURL, timeout });
        this.name = name;
        this.defaultModel = defaultModel;
        this.client = new OpenAI({ apiKey, baseURL, timeout });
    }

    async chat({ messages, model, systemPrompt, signal }) {
        const payload = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        const completion = await this.client.chat.completions.create({
            model: model || this.defaultModel,
            messages: payload,
            stream: false
        }, { signal });

        return {
            text: completion.choices[0]?.message?.content ?? '',
            usage: {
                promptTokens: completion.usage?.prompt_tokens ?? 0,
                completionTokens: completion.usage?.completion_tokens ?? 0
            }
        };
    }

    async *streamChat({ messages, model, systemPrompt, signal }) {
        const payload = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        const stream = await this.client.chat.completions.create({
            model: model || this.defaultModel,
            messages: payload,
            stream: true,
            stream_options: { include_usage: true }
        }, { signal });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            const usage = chunk.usage ? {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens
            } : null;

            if (text || usage) {
                yield { text, usage };
            }
        }
    }
}