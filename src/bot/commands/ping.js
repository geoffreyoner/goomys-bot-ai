import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Lihat latency bot');

export async function execute(interaction) {
    const sent = Date.now();
    await interaction.reply({ content: 'Mengukur...', flags: MessageFlags.Ephemeral });
    const latency = Date.now() - sent;
    const ws = Math.round(interaction.client.ws.ping);
    await interaction.editReply({
        content: `WebSocket: ${ws}ms\nRound-trip: ${latency}ms`
    });
}