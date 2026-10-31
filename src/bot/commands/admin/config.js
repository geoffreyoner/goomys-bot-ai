import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getGuildSettings } from '../../../database/repositories/guildRepo.js';
import { env } from '../../../config/env.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Lihat konfigurasi server saat ini');

export async function execute(interaction) {
    const s = getGuildSettings(interaction.guildId);
    const currentModel = s?.default_model || env.DEFAULT_MODEL;
    const currentProvider = s?.default_provider || env.DEFAULT_PROVIDER;
    
    const lines = [
        `Default model: ${currentModel} ${s?.default_model ? '' : '(from .env)'}`,
        `Default provider: ${currentProvider} ${s?.default_provider ? '' : '(from .env)'}`,
        `System prompt: ${s?.system_prompt ? '(custom)' : '(default)'}`,
        `AI channel: ${s?.ai_channel_id ? `<#${s.ai_channel_id}>` : 'Semua channel'}`,
        `Maintenance: ${s?.maintenance ? 'ON' : 'OFF'}`
    ];
    
    await interaction.reply({
        content: lines.join('\n'),
        flags: MessageFlags.Ephemeral
    });
}