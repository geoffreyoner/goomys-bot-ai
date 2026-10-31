import { EmbedBuilder } from 'discord.js';
import { EMBED_COLOR, ERROR_COLOR, FOOTER_TEXT } from '../config/constants.js';

export function createAIEmbed({ description, model, latencyMs }) {
    const footerParts = [`Model: ${model}`];
    
    if (typeof latencyMs === 'number') {
        footerParts.push(`${latencyMs}ms`);
    }

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setAuthor({ name: FOOTER_TEXT })
        .setDescription(description.slice(0, 4096))
        .setFooter({ text: footerParts.join(' · ') });
}

export function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setAuthor({ name: FOOTER_TEXT })
        .setDescription(message)
        .setFooter({ text: FOOTER_TEXT });
}

export function createInfoEmbed({ title, description }) {
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: FOOTER_TEXT });
}