import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setSystemPrompt } from '../../../database/repositories/guildRepo.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('setprompt')
    .setDescription('Set system prompt server')
    .addStringOption(o => o
        .setName('prompt')
        .setDescription('Prompt baru, kosongkan untuk reset ke default')
        .setRequired(false)
        .setMaxLength(4000));

export async function execute(interaction) {
    const prompt = interaction.options.getString('prompt') ?? '';
    setSystemPrompt(interaction.guildId, prompt.length > 0 ? prompt : null);
    await interaction.reply({
        content: prompt.length > 0 ? 'System prompt diperbarui' : 'System prompt direset ke default',
        flags: MessageFlags.Ephemeral
    });
}