import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { env } from '../../../config/env.js';
import { PROVIDER_MODELS, isValidModel } from '../../../config/models.js';
import { setDefaultModel } from '../../../database/repositories/guildRepo.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('setmodel')
    .setDescription('Set default model server')
    .addStringOption(o => o
        .setName('provider')
        .setDescription('Provider')
        .setRequired(true)
        .addChoices(...env.availableProviders.map(p => ({ name: p, value: p }))))
    .addStringOption(o => o
        .setName('model')
        .setDescription('Nama model')
        .setRequired(true));

export async function execute(interaction) {
    const provider = interaction.options.getString('provider', true);
    const model = interaction.options.getString('model', true);

    if (!isValidModel(provider, model)) {
        const list = PROVIDER_MODELS[provider] ?? [];
        throw new Error(`Model tidak valid. Tersedia: ${list.join(', ') || 'bebas'}`);
    }

    setDefaultModel(interaction.guildId, model, provider);
    await interaction.reply({
        content: `Default model server: ${model} (${provider})`,
        flags: MessageFlags.Ephemeral
    });
}