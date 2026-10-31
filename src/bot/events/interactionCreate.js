import { Events } from 'discord.js';
import { requireAdmin } from '../../middleware/permissions.js';
import { createErrorEmbed } from '../../utils/embeds.js';
import { logger } from '../../services/logger.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        logger.warn({ event: 'unknown_command', name: interaction.commandName });
        return;
    }

    try {
        if (command.adminOnly) requireAdmin(interaction);
        await command.execute(interaction);
    } catch (err) {
        logger.error({
            event: 'command_error',
            command: interaction.commandName,
            userId: interaction.user.id,
            guildId: interaction.guildId,
            message: err.message
        });

        const embed = createErrorEmbed(err.message || 'Terjadi kesalahan');
        const payload = { embeds: [embed] };

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload);
            } else {
                await interaction.reply({ ...payload, ephemeral: true });
            }
        } catch {
        }
    }
}