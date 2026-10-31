import { PermissionsBitField } from 'discord.js';

export function requireAdmin(interaction) {
    const allowed = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)
        || interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
    if (!allowed) {
        throw new Error('Command ini memerlukan permission Manage Server');
    }
}

export function requireGuild(interaction) {
    if (!interaction.guildId) {
        throw new Error('Command ini hanya bisa dipakai di dalam server');
    }
}