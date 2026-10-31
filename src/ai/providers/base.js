export class BaseProvider {
    constructor({ apiKey, baseURL, timeout = 60000 }) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.name = 'base';
        this.defaultModel = 'unknown';
    }

    async chat() {
        throw new Error('chat() not implemented');
    }

    async *streamChat() {
        throw new Error('streamChat() not implemented');
    }
}