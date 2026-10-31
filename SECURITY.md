# Kebijakan Keamanan

## Versi yang Didukung

Perbaikan keamanan diberikan untuk rilis stabil terbaru.

| Versi | Didukung |
|---|---|
| 1.0.x | Ya |
| < 1.0 | Tidak |

## Melaporkan Kerentanan

Jangan menyertakan token, API key, atau data pengguna nyata dalam laporan.

Sertakan:

- deskripsi kerentanan dan dampaknya,
- langkah reproduksi atau proof of concept minimal,
- versi bot, versi Node.js, dan sistem operasi,
- saran perbaikan, jika ada.

### Proses penanganan

- Konfirmasi penerimaan laporan dalam 3 hari kerja.
- Penilaian awal dan estimasi waktu perbaikan dalam 7 hari kerja.
- Perbaikan dirilis sesegera mungkin sesuai tingkat keparahan dan dicatat di [CHANGELOG.md](CHANGELOG.md).
- Pelapor dikreditkan pada catatan rilis, kecuali meminta tidak disebutkan.
- Mohon beri waktu yang wajar untuk perbaikan sebelum mengungkapkan detail secara publik.

### Cakupan

Dalam cakupan: kebocoran kredensial, SQL injection, bypass pemeriksaan permission admin, bypass rate limit dan batas penggunaan, serta pengungkapan data antar pengguna atau antar server.

Di luar cakupan: kerentanan pada dependensi pihak ketiga yang belum diperbaiki di hulu (laporkan ke proyek terkait), konfigurasi server atau VPS milik pengguna, dan serangan yang memerlukan akses fisik atau akses ke akun yang sudah dikompromikan.

## Peringatan: File .env dan Kebocoran API Key

File `.env` berisi kredensial yang memberi kendali penuh atas bot dan tagihan akun provider Anda.

- **Jangan** meng-commit `.env`. File ini sudah ada di `.gitignore`; jangan menghapus entri tersebut.
- **Jangan** membagikan isi `.env`, tangkapan layar, atau log yang memuat token dan API key di issue, pull request, forum, atau chat publik.
- **Jangan** menempelkan token ke kode sumber. Gunakan hanya variabel environment.
- Gunakan `.env.example` tanpa nilai sebagai satu-satunya template yang dibagikan.
- Batasi akses file di server: `chmod 600 .env`.
- Jalankan bot dengan akun pengguna non-root.
- Gunakan API key terpisah untuk pengembangan dan produksi, dan atur batas pengeluaran (spending limit) di dashboard provider.
- Aktifkan secret scanning dan push protection pada repositori GitHub Anda.

### Jika kredensial terlanjur bocor

Anggap kredensial yang pernah terekspos sebagai sudah dikompromikan, termasuk jika commit sudah dihapus.

1. **Cabut dan buat ulang kredensial segera.**
   - Token Discord: Developer Portal, menu Bot, **Reset Token**.
   - API key provider (Gemini, OpenAI, DeepSeek, OpenRouter, Groq, kustom): cabut key di dashboard provider masing-masing dan buat yang baru.
2. Perbarui `.env` dengan nilai baru, lalu restart bot.
3. Periksa dashboard penggunaan dan tagihan provider untuk aktivitas yang tidak dikenal.
4. Bersihkan riwayat Git menggunakan `git filter-repo` atau BFG Repo-Cleaner, lalu lakukan force push. Langkah ini tidak menggantikan pencabutan kredensial; riwayat lama mungkin sudah tersalin atau ter-cache.
5. Jika repositori publik, anggap kebocoran sudah terjadi sejak commit pertama yang memuat kredensial.

## Perlindungan yang Diterapkan

- Kredensial hanya dibaca dari environment dan divalidasi saat startup. Kredensial tidak ditulis ke database dan tidak dikirim ke Discord.
- Logger (pino) menyamarkan field `apiKey`, `token`, `password`, dan header `authorization`.
- Seluruh query SQL memakai prepared statement dengan parameter binding.
- Perintah admin diperiksa pada runtime terhadap permission Manage Server atau Administrator.
- Input pengguna divalidasi (panjang 1 sampai 4000 karakter) sebelum diproses.
- Pembatasan penggunaan: cooldown per user, batas konkurensi per user, dan batas request harian.
- Pesan galat dari provider dinormalisasi sebelum ditampilkan ke pengguna.

## Privasi dan Data

- Isi percakapan disimpan sebagai teks biasa di database SQLite lokal (`DATABASE_PATH`) sesuai `MAX_HISTORY_MESSAGES`.
- Isi pesan dikirim ke provider AI yang dipilih dan tunduk pada kebijakan data provider tersebut.
- Lindungi direktori `data/` dari akses pihak lain, dan enkripsi backup database.
- Pengguna dapat menghapus riwayat mereka di channel tertentu dengan `/reset`. Penghapusan data server saat bot dikeluarkan hanya mencakup pengaturan server.

## Rekomendasi Hardening Deployment

- Berikan bot hanya permission Discord yang diperlukan: View Channels, Send Messages, Embed Links, Read Message History. Jangan memberikan Administrator.
- Jaga sistem operasi dan Node.js tetap diperbarui, dan jalankan `npm audit` secara berkala.
- Gunakan firewall pada VPS dan jangan membuka port yang tidak diperlukan. Bot hanya membuat koneksi keluar.
- Simpan backup database di lokasi terenkripsi dengan akses terbatas.
- Pantau log untuk lonjakan galat 401, 403, dan 429 yang dapat menandakan penyalahgunaan atau kebocoran key.