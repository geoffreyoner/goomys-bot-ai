import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panduan penggunaan Goomys AI');

export async function execute(interaction) {
    const help = [
        'Goomys AI',
        '',
        'User Commands',
        '/chat message - Bicara dengan AI',
        '/reset - Hapus riwayat percakapan',
        '/model - Lihat atau ganti model',
        '/models - Daftar model tersedia',
        '/memory - Status memori percakapan',
        '/ping - Latency bot',
        '',
        'Admin Commands',
        '/config - Lihat konfigurasi server',
        '/setmodel - Set default model server',
        '/setprompt - Set system prompt server',
        '/setchannel - Set channel AI khusus',
        '/stats - Statistik penggunaan',
        '/maintenance - Toggle maintenance mode'
    ].join('\n');

    await interaction.reply({ content: help, flags: MessageFlags.Ephemeral });
}