import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { memoryManager } from '../../conversation/manager.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('memory')
    .setDescription('Lihat status memori percakapan kamu');

export async function execute(interaction) {
    const conversation = memoryManager.getOrCreate({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        model: 'inspect'
    });
    const status = memoryManager.status(conversation.id);
    const updated = conversation.updated_at
        ? new Date(conversation.updated_at * 1000).toISOString()
        : 'never';

    await interaction.reply({
        content: `Pesan tersimpan: ${status.messageCount}\nModel: ${conversation.model}\nTerakhir diperbarui: ${updated}`,
        flags: MessageFlags.Ephemeral
    });
}