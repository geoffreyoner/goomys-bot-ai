import { z } from 'zod';

const promptSchema = z.string().min(1).max(4000);

export function validatePrompt(input) {
    const result = promptSchema.safeParse(input);
    if (!result.success) {
        throw new Error('Pesan tidak valid (1-4000 karakter)');
    }
    return result.data;
}