import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { env } from '../../config/env.js';
import { PROVIDER_MODELS } from '../../config/models.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('models')
    .setDescription('Lihat daftar model yang tersedia');

export async function execute(interaction) {
    const lines = [];
    for (const provider of env.availableProviders) {
        const models = PROVIDER_MODELS[provider] ?? [];
        if (models.length === 0) continue;
        lines.push(`**${provider}**: ${models.join(', ')}`);
    }
    await interaction.reply({
        content: lines.join('\n') || 'Tidak ada model tersedia',
        flags: MessageFlags.Ephemeral
    });
}