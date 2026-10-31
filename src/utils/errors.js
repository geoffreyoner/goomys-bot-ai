export class UserFacingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserFacingError';
    }
}

export class ProviderError extends Error {
    constructor(message, provider) {
        super(message);
        this.name = 'ProviderError';
        this.provider = provider;
    }
}