import { SlashCommandBuilder, MessageFlags, ChannelType } from 'discord.js';
import { setAiChannel } from '../../../database/repositories/guildRepo.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set channel AI khusus, kosongkan untuk reset')
    .addChannelOption(o => o
        .setName('channel')
        .setDescription('Channel AI')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false));

export async function execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    setAiChannel(interaction.guildId, channel?.id ?? null);
    await interaction.reply({
        content: channel ? `Channel AI diset ke <#${channel.id}>` : 'Channel AI direset',
        flags: MessageFlags.Ephemeral
    });
}