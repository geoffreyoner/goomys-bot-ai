import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { env } from '../../config/env.js';
import { PROVIDER_MODELS, isValidModel } from '../../config/models.js';
import { getGuildSettings } from '../../database/repositories/guildRepo.js';
import { setPreferredModel, getUserSettings } from '../../database/repositories/userRepo.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('model')
    .setDescription('Lihat atau ganti model AI aktif')
    .addStringOption(o => o
        .setName('provider')
        .setDescription('Provider')
        .addChoices(...env.availableProviders.map(p => ({ name: p, value: p }))))
    .addStringOption(o => o
        .setName('model')
        .setDescription('Nama model'));

export async function execute(interaction) {
    const provider = interaction.options.getString('provider');
    const model = interaction.options.getString('model');

    if (!provider && !model) {
        const guild = getGuildSettings(interaction.guildId);
        const user = getUserSettings(interaction.user.id);
        const currentProvider = user?.preferred_provider || guild?.default_provider || env.DEFAULT_PROVIDER;
        const currentModel = user?.preferred_model || guild?.default_model || env.DEFAULT_MODEL;
        await interaction.reply({
            content: `Model aktif: ${currentModel}\nProvider: ${currentProvider}`,
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (!provider || !model) {
        throw new Error('Kamu harus mengisi provider dan model sekaligus');
    }

    if (!env.availableProviders.includes(provider)) {
        throw new Error(`Provider "${provider}" tidak dikonfigurasi`);
    }

    if (!isValidModel(provider, model)) {
        const available = PROVIDER_MODELS[provider] ?? [];
        throw new Error(`Model tidak valid. Model tersedia: ${available.join(', ') || 'bebas'}`);
    }

    setPreferredModel(interaction.user.id, model, provider);
    await interaction.reply({
        content: `Model kamu diganti ke ${model} (${provider})`,
        flags: MessageFlags.Ephemeral
    });
}