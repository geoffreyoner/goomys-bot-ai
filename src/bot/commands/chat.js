import { SlashCommandBuilder } from 'discord.js';
import { handleAIInteraction } from '../../services/aiInteraction.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Bicara dengan Goomys AI')
    .addStringOption(o => o
        .setName('message')
        .setDescription('Pesan kamu')
        .setRequired(true)
        .setMaxLength(4000));

export async function execute(interaction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('message', true);
    await handleAIInteraction({
        source: interaction,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        prompt,
        replyTarget: interaction
    });
}