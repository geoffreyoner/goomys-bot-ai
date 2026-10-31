import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './base.js';

export class GeminiProvider extends BaseProvider {
    constructor(opts) {
        super(opts);
        this.name = 'gemini';
        this.defaultModel = 'gemini-3.5-flash-lite';
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    async chat({ messages, model, systemPrompt }) {
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const response = await this.client.models.generateContent({
            model: model || this.defaultModel,
            contents,
            config: { 
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }]
            }
        });

        return {
            text: response.text ?? '',
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0
            }
        };
    }

    async *streamChat({ messages, model, systemPrompt }) {
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const responseStream = await this.client.models.generateContentStream({
            model: model || this.defaultModel,
            contents,
            config: { 
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }]
            }
        });

        for await (const chunk of responseStream) {
            yield {
                text: chunk.text || '',
                usage: chunk.usageMetadata ? {
                    promptTokens: chunk.usageMetadata.promptTokenCount || 0,
                    completionTokens: chunk.usageMetadata.candidatesTokenCount || 0
                } : null
            };
        }
    }
}