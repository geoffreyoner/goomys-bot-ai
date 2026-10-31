import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { setMaintenance } from '../../../database/repositories/guildRepo.js';

export const adminOnly = true;

export const data = new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Aktifkan atau matikan mode maintenance')
    .addBooleanOption(o => o
        .setName('enabled')
        .setDescription('true = ON, false = OFF')
        .setRequired(true));

export async function execute(interaction) {
    const enabled = interaction.options.getBoolean('enabled', true);
    setMaintenance(interaction.guildId, enabled);
    await interaction.reply({
        content: `Maintenance mode: ${enabled ? 'ON' : 'OFF'}`,
        flags: MessageFlags.Ephemeral
    });
}