import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { memoryManager } from '../../conversation/manager.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Hapus riwayat percakapan kamu di channel ini');

export async function execute(interaction) {
    const conversation = memoryManager.getOrCreate({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        model: 'reset'
    });
    memoryManager.clear(conversation.id);
    await interaction.reply({
        content: 'Riwayat percakapan dihapus',
        flags: MessageFlags.Ephemeral
    });
}