# Goomys Bot Discord AI

Bot Discord AI chat siap produksi berbasis JavaScript (ES Modules), discord.js v14, dan arsitektur multi-provider. Mendukung Gemini, OpenAI, DeepSeek, OpenRouter, Groq, serta API kustom yang kompatibel dengan OpenAI. Dapat dijalankan di Windows, Linux, VPS, maupun Android melalui Termux tanpa Docker.

## Daftar Isi

- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Setup Discord](#setup-discord)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Bot](#menjalankan-bot)
- [Ringkasan Arsitektur](#ringkasan-arsitektur)
- [Daftar Perintah](#daftar-perintah)
- [Catatan Keamanan](#catatan-keamanan)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

## Fitur

- **Multi-provider**: Gemini (`@google/genai`), OpenAI, DeepSeek, OpenRouter, Groq, dan endpoint kustom kompatibel OpenAI. Provider ditambahkan lewat pola adapter.
- **Streaming response**: balasan diperbarui bertahap dengan throttle 1,5 detik per edit agar tidak terkena rate limit Discord. Balasan panjang dipecah otomatis menjadi beberapa embed.
- **Pencarian web (grounding)**: provider Gemini memakai tool Google Search bawaan Gemini.
- **Memori percakapan**: riwayat disimpan per kombinasi user, guild, dan channel, dengan pemangkasan otomatis sesuai `MAX_HISTORY_MESSAGES`.
- **Anti-abuse**: cooldown per user, batas request harian, batas konkurensi per user, dan mode maintenance per server.
- **Slash command**: perintah untuk user dan admin server. Bot juga merespons mention dan reply ke pesan bot.
- **Konfigurasi per server**: model default, provider default, system prompt, dan channel AI disimpan di database.
- **Pelacakan penggunaan**: request, token, dan latency dicatat per server (`/stats`).
- **Penyimpanan**: SQLite bawaan Node.js (`node:sqlite`), tanpa dependensi native tambahan.
- **Validasi environment**: seluruh variabel divalidasi dengan Zod saat startup. Bot berhenti dengan pesan galat jika konfigurasi tidak valid.
- **Logging terstruktur**: pino dengan redaksi otomatis untuk field sensitif.

## Prasyarat

| Kebutuhan | Versi | Keterangan |
|---|---|---|
| Node.js | 22.13 atau lebih baru (LTS) | Modul `node:sqlite` tidak tersedia di Node.js 20. |
| npm | Bawaan Node.js | |
| Git | Versi terbaru | Untuk meng-clone repositori. |
| Akun Discord | | Untuk membuat aplikasi bot. |
| API key | Minimal satu provider | Lihat [Konfigurasi Environment](#konfigurasi-environment). |

Periksa versi terpasang:

```bash
node -v
git --version
```

## Instalasi

Ganti `geoffreyoner` pada URL dengan akun atau organisasi pemilik repositori.

### Windows

1. Pasang Node.js LTS dan Git. Dengan `winget` di PowerShell:

   ```powershell
   winget install OpenJS.NodeJS.LTS
   winget install Git.Git
   ```

   Tutup dan buka kembali PowerShell, lalu verifikasi dengan `node -v`.

2. Clone repositori dan pasang dependensi:

   ```powershell
   git clone https://github.com/geoffreyoner/goomys-bot-ai.git
   cd goomys-bot-ai
   npm install
   ```

3. Buat file konfigurasi:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

4. Lanjutkan ke [Setup Discord](#setup-discord), lalu daftarkan slash command dan jalankan bot:

   ```powershell
   npm run deploy
   npm start
   ```

### Linux dan VPS

1. Pasang Git dan Node.js 22 LTS. Contoh memakai [nvm](https://github.com/nvm-sh/nvm):

   ```bash
   sudo apt update && sudo apt install -y git curl
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.bashrc
   nvm install 22
   nvm use 22
   node -v
   ```

2. Clone repositori dan pasang dependensi:

   ```bash
   git clone https://github.com/geoffreyoner/goomys-bot-ai.git
   cd goomys-bot-ai
   npm install
   ```

3. Buat file konfigurasi dan batasi permission-nya:

   ```bash
   cp .env.example .env
   chmod 600 .env
   nano .env
   ```

4. Lanjutkan ke [Setup Discord](#setup-discord), lalu:

   ```bash
   npm run deploy
   npm start
   ```

### Android (Termux)

Pasang Termux dari F-Droid atau rilis resmi di GitHub. Versi Termux di Play Store tidak lagi dipelihara.

1. Perbarui paket dan pasang dependensi:

   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git tmux
   node -v
   ```

   Pastikan versi Node.js yang terpasang memenuhi prasyarat (22.13 atau lebih baru). Jika paket `nodejs` di repositori Termux Anda lebih lama, gunakan paket `nodejs-lts` atau perbarui repositori Termux.

2. Clone repositori dan pasang dependensi:

   ```bash
   git clone https://github.com/geoffreyoner/goomys-bot-ai.git
   cd goomys-bot-ai
   npm install
   ```

3. Buat file konfigurasi:

   ```bash
   cp .env.example .env
   nano .env
   ```

4. Lanjutkan ke [Setup Discord](#setup-discord), lalu:

   ```bash
   npm run deploy
   tmux new -s goomys
   npm start
   ```

5. Agar proses tidak dihentikan Android saat layar mati, jalankan `termux-wake-lock` dan nonaktifkan optimasi baterai untuk Termux di pengaturan sistem.

## Setup Discord

### 1. Buat aplikasi dan bot

1. Buka [Discord Developer Portal](https://discord.com/developers/applications) dan pilih **New Application**.
2. Salin **Application ID** dari halaman General Information. Nilai ini dipakai sebagai `DISCORD_CLIENT_ID`.
3. Buka menu **Bot**, lalu pilih **Reset Token** dan salin token. Nilai ini dipakai sebagai `DISCORD_TOKEN`. Token hanya ditampilkan sekali.

### 2. Aktifkan Privileged Gateway Intents

Pada menu **Bot**, bagian **Privileged Gateway Intents**, aktifkan:

- **Message Content Intent** (wajib)

Bot mendaftarkan intent berikut di `src/bot/client.js`:

| Intent | Jenis | Kegunaan |
|---|---|---|
| `Guilds` | Standar | Data server dan event guild. |
| `GuildMessages` | Standar | Menerima pesan di channel server. |
| `DirectMessages` | Standar | Menerima pesan DM. |
| `MessageContent` | Privileged | Membaca isi pesan untuk respons mention dan reply. |

Tanpa Message Content Intent yang aktif di portal, bot gagal login dengan galat `Used disallowed intents`.

### 3. Undang bot ke server

Buka menu **OAuth2 > URL Generator**:

- **Scopes**: `bot` dan `applications.commands`
- **Bot Permissions**: `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`

Salin URL yang dihasilkan, buka di browser, lalu pilih server tujuan. Bentuk URL:

```
https://discord.com/oauth2/authorize?client_id=<DISCORD_CLIENT_ID>&scope=bot%20applications.commands&permissions=84992
```

Nilai `permissions=84992` adalah gabungan keempat permission di atas.

### 4. Daftarkan slash command

```bash
npm run deploy
```

- Jika `DISCORD_GUILD_ID` terisi, command didaftarkan hanya pada server tersebut dan langsung aktif. Disarankan untuk pengembangan.
- Jika kosong, command didaftarkan secara global. Propagasi global dapat memakan waktu hingga sekitar satu jam.

Jalankan ulang `npm run deploy` setiap kali command ditambah, dihapus, atau diubah definisinya.

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu isi nilainya. File `.env` sudah terdaftar di `.gitignore` dan tidak boleh di-commit.

Minimal satu API key provider harus terisi. Jika tidak ada, bot berhenti saat startup.

### Discord

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DISCORD_TOKEN` | Ya | | Token bot dari Developer Portal. |
| `DISCORD_CLIENT_ID` | Ya | | Application ID. |
| `DISCORD_GUILD_ID` | Tidak | kosong | ID server untuk registrasi command bersifat guild. Kosongkan untuk registrasi global. |

### Provider AI

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DEFAULT_PROVIDER` | Tidak | `gemini` | Salah satu dari `gemini`, `openai`, `deepseek`, `openrouter`, `groq`, `custom`. API key provider ini harus terisi. |
| `DEFAULT_MODEL` | Ya | | Model default, contoh `gemini-2.5-flash`. Dipakai jika server belum menetapkan model sendiri. |
| `GEMINI_API_KEY` | Tidak | | API key Google Gemini. |
| `OPENAI_API_KEY` | Tidak | | API key OpenAI. |
| `DEEPSEEK_API_KEY` | Tidak | | API key DeepSeek. |
| `OPENROUTER_API_KEY` | Tidak | | API key OpenRouter. |
| `GROQ_API_KEY` | Tidak | | API key Groq. |
| `CUSTOM_BASE_URL` | Tidak | | Base URL endpoint kompatibel OpenAI, contoh `https://host.example/v1`. |
| `CUSTOM_API_KEY` | Tidak | | API key endpoint kustom. Provider `custom` aktif hanya jika `CUSTOM_BASE_URL` dan `CUSTOM_API_KEY` keduanya terisi. |

Provider `custom` memakai `DEFAULT_MODEL` sebagai model bawaannya dan menerima nama model apa pun pada `/model` dan `/setmodel`.

### Penyimpanan dan batas penggunaan

| Variabel | Default | Keterangan |
|---|---|---|
| `DATABASE_PATH` | `./data/goomys.sqlite` | Lokasi file SQLite. Direktori dibuat otomatis. |
| `MAX_HISTORY_MESSAGES` | `20` | Jumlah pesan maksimum per percakapan yang dikirim ke AI dan disimpan setelah pemangkasan. |
| `MAX_CONCURRENT_REQUESTS` | `5` | Jumlah request yang boleh diproses bersamaan untuk satu user. |
| `USER_COOLDOWN` | `5` | Jeda minimum antar request satu user, dalam detik. `0` menonaktifkan cooldown. |
| `DAILY_REQUEST_LIMIT` | `100` | Batas request sukses per user per hari. `0` menonaktifkan batas. Hari dihitung berdasarkan UTC. |
| `REQUEST_TIMEOUT` | `60000` | Timeout request ke provider, dalam milidetik. |
| `LOG_LEVEL` | `info` | Salah satu dari `debug`, `info`, `warn`, `error`. |

## Menjalankan Bot

Skrip yang tersedia:

| Perintah | Fungsi |
|---|---|
| `npm start` | Menjalankan bot. |
| `npm run deploy` | Mendaftarkan slash command ke Discord. |
| `npm test` | Menjalankan unit test dengan test runner bawaan Node.js. |

Skema database dibuat otomatis saat bot dijalankan pertama kali.

Log ditulis ke stdout dalam format JSON. Gunakan process manager atau redirect untuk menyimpannya.

### tmux

```bash
tmux new -s goomys
npm start
```

Lepas dari sesi dengan `Ctrl+B` lalu `D`. Kembali ke sesi:

```bash
tmux attach -t goomys
```

### pm2

```bash
npm install -g pm2
cd /path/ke/goomys-bot-ai
pm2 start src/index.js --name goomys-bot
pm2 save
pm2 startup
```

Perintah operasional:

```bash
pm2 status
pm2 logs goomys-bot
pm2 restart goomys-bot
pm2 stop goomys-bot
```

Jalankan pm2 dari direktori proyek. `.env` dan `DATABASE_PATH` bawaan dibaca relatif terhadap working directory.

## Ringkasan Arsitektur

```
goomys-bot-ai/
├── data/                       File SQLite (diabaikan Git)
├── logs/                       Direktori log opsional
├── scripts/
│   └── deploy-commands.js      Registrasi slash command ke Discord
├── src/
│   ├── index.js                Entry point, handler proses, login
│   ├── ai/
│   │   ├── manager.js          Orkestrasi provider, retry, normalisasi galat
│   │   ├── prompt.js           Penyusunan system prompt
│   │   └── providers/
│   │       ├── base.js             Kontrak BaseProvider
│   │       ├── gemini.js           Adapter Gemini (Google Search tool)
│   │       ├── openaiCompatible.js Adapter generik kompatibel OpenAI
│   │       └── index.js            Registry dan factory provider
│   ├── bot/
│   │   ├── client.js           Pembuatan client dan loader command/event
│   │   ├── commands/           Slash command user
│   │   │   └── admin/          Slash command admin
│   │   └── events/             Event handler discord.js
│   ├── config/
│   │   ├── env.js              Validasi environment (Zod)
│   │   ├── constants.js        Konstanta dan system prompt default
│   │   └── models.js           Daftar model per provider
│   ├── conversation/           Manajemen memori percakapan
│   ├── database/
│   │   ├── connection.js       Koneksi SQLite dan inisialisasi skema
│   │   ├── schema.sql          Definisi tabel
│   │   ├── sqliteCompat.js     Pembungkus node:sqlite
│   │   └── repositories/       Akses data per entitas
│   ├── middleware/             Rate limiter, permission, validator
│   ├── services/               Alur interaksi AI, logger, usage tracker
│   └── utils/                  Embed, splitter pesan, format, galat
└── tests/                      Unit dan integration test
```

Alur satu request:

1. Pesan masuk melalui slash command `/chat`, mention bot, atau reply ke pesan bot.
2. `services/aiInteraction.js` memvalidasi prompt, memeriksa cooldown, konkurensi, batas harian, dan status maintenance.
3. Riwayat percakapan diambil dari SQLite melalui `conversation/memory.js`.
4. `ai/manager.js` memilih provider dari registry dan memulai streaming.
5. Potongan teks ditampilkan melalui edit embed dengan throttle. Hasil akhir disimpan ke memori, dipangkas, lalu dicatat ke `usage_logs`.

Tabel database: `guild_settings`, `user_settings`, `conversations`, `messages`, `usage_logs`.

## Daftar Perintah

Selain slash command, bot merespons ketika di-mention atau ketika pesannya dibalas (reply).

### Perintah user

| Perintah | Keterangan |
|---|---|
| `/chat message:<teks>` | Mengirim pesan ke AI (maksimum 4000 karakter). |
| `/reset` | Menghapus riwayat percakapan Anda di channel saat ini. |
| `/model [provider] [model]` | Tanpa argumen: menampilkan model aktif. Dengan `provider` dan `model`: menyimpan preferensi model Anda. |
| `/models` | Menampilkan daftar model per provider yang aktif. |
| `/memory` | Menampilkan jumlah pesan tersimpan, model, dan waktu pembaruan terakhir. |
| `/ping` | Menampilkan latency WebSocket dan round-trip. |
| `/help` | Menampilkan ringkasan perintah. |

### Perintah admin

Memerlukan permission **Manage Server** atau **Administrator**.

| Perintah | Keterangan |
|---|---|
| `/config` | Menampilkan konfigurasi server saat ini. |
| `/setmodel provider:<p> model:<m>` | Menetapkan provider dan model default server. |
| `/setprompt [prompt]` | Menetapkan system prompt server. Kosongkan untuk kembali ke default. |
| `/setchannel [channel]` | Menetapkan channel AI server. Kosongkan untuk mereset. |
| `/maintenance enabled:<true/false>` | Mengaktifkan atau menonaktifkan mode maintenance server. |
| `/stats` | Menampilkan total request, sukses, gagal, token, dan rata-rata latency server. |

Model yang valid untuk provider bawaan didefinisikan di `src/config/models.js`. Untuk menambah model, edit file tersebut.

## Catatan Keamanan

- API key dan token dibaca hanya dari environment. Keduanya tidak disimpan di database dan tidak dikirim ke Discord.
- `.env` dan file database (`data/*.sqlite*`) tercantum di `.gitignore`. Jangan menghapus entri tersebut.
- Seluruh query SQL memakai prepared statement dengan parameter binding.
- Logger menyamarkan field `apiKey`, `token`, `password`, dan header `authorization`.
- Perintah admin diperiksa pada sisi server (runtime) terhadap permission Manage Server atau Administrator.
- Riwayat percakapan disimpan sebagai teks biasa di SQLite dan isi pesan dikirim ke provider AI pihak ketiga. Beri tahu pengguna server Anda mengenai hal ini.
- Jika kunci atau token pernah terekspos, cabut dan buat ulang segera. Lihat [SECURITY.md](SECURITY.md).

## Troubleshooting

**`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` atau `Cannot find module 'node:sqlite'`**
Versi Node.js terlalu lama. Perbarui ke 22.13 atau lebih baru (`node -v`). Pada Node.js 22.x, modul ini dapat menampilkan `ExperimentalWarning`; peringatan tersebut tidak menghentikan bot.

**Galat terkait binding native SQLite (`better-sqlite3`, `bindings`, `node-gyp`)**
Proyek ini memakai `node:sqlite` bawaan dan tidak memerlukan kompilasi native. Galat semacam itu berasal dari `node_modules` lama atau dependensi yang tidak sesuai. Hapus dan pasang ulang:

```bash
rm -rf node_modules package-lock.json
npm install
```

Di Windows PowerShell gunakan `Remove-Item -Recurse -Force node_modules`.

**`Used disallowed intents` saat login**
Message Content Intent belum diaktifkan. Aktifkan di Developer Portal pada menu Bot, bagian Privileged Gateway Intents, lalu jalankan ulang bot.

**Bot online tetapi tidak merespons mention atau reply**
Pastikan Message Content Intent aktif, bot memiliki permission View Channels, Send Messages, dan Embed Links di channel tersebut, dan pesan benar-benar me-mention bot atau membalas pesan bot.

**Slash command tidak muncul**
Jalankan `npm run deploy`. Untuk registrasi global, tunggu propagasi. Gunakan `DISCORD_GUILD_ID` agar command langsung muncul di satu server. Pastikan bot diundang dengan scope `applications.commands`.

**`Environment validation failed`**
Periksa daftar isu yang dicetak. Penyebab umum: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, atau `DEFAULT_MODEL` kosong, `DEFAULT_PROVIDER` bernilai di luar enum, atau `CUSTOM_BASE_URL` bukan URL valid.

**`Tidak ada API key provider yang dikonfigurasi`**
Isi minimal satu variabel API key di `.env`.

**`Provider "..." tidak dikonfigurasi (API key kosong)`**
Provider yang dipilih (lewat `DEFAULT_PROVIDER` atau `/setmodel`) tidak memiliki API key. Isi key-nya atau ganti provider.

**`API key untuk provider "..." tidak valid`**
Provider mengembalikan status 401 atau 403. Periksa key, kuota, dan akses model pada akun provider.

**`Model tidak valid`**
Model tidak ada di `src/config/models.js` untuk provider tersebut. Tambahkan model ke daftar, atau gunakan provider `custom` yang menerima nama model bebas.

**Request sering timeout**
Naikkan `REQUEST_TIMEOUT`, periksa koneksi jaringan, atau pilih model yang lebih ringan.

**Respons rate-limited (HTTP 429)**
Bot mengulang otomatis dengan backoff pada request non-streaming. Kurangi frekuensi request atau tingkatkan kuota di sisi provider.

**Proses berhenti sendiri di Termux**
Aktifkan `termux-wake-lock`, nonaktifkan optimasi baterai untuk Termux, dan jalankan bot di dalam tmux.

**Reset total data**
Hentikan bot, lalu hapus file `data/goomys.sqlite` beserta file `-wal` dan `-shm`. Skema dibuat ulang pada startup berikutnya.

## Lisensi

Didistribusikan di bawah [MIT License](LICENSE).

<div align="center">

Dibuat dengan ❤️ oleh Goomys

</div>
