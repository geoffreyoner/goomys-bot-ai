import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getGuildStats } from '../../../database/repositories/usageRepo.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Statistik penggunaan bot di server ini');

export async function execute(interaction) {
    const s = getGuildStats(interaction.guildId);
    await interaction.reply({
        content: [
            `Total request: ${s.total}`,
            `Sukses: ${s.success}`,
            `Gagal: ${s.errors}`,
            `Total token: ${s.tokens}`,
            `Rata-rata latency: ${s.avgLatency}ms`
        ].join('\n'),
        flags: MessageFlags.Ephemeral
    });
}