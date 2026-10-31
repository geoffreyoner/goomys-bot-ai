# Changelog

Seluruh perubahan penting pada proyek ini dicatat di berkas ini.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [1.0.0] - 2026-10-31

Rilis awal.

### Ditambahkan

#### Arsitektur multi-provider

- Kontrak `BaseProvider` dengan metode `chat()` dan `streamChat()` (async generator) sebagai antarmuka seragam untuk seluruh provider.
- Registry provider berbasis factory (`src/ai/providers/index.js`). Provider hanya aktif jika API key-nya terisi.
- Adapter `GeminiProvider` berbasis `@google/genai`, dengan tool Google Search (grounding) bawaan Gemini untuk pencarian web.
- Adapter `OpenAICompatibleProvider` berbasis paket `openai` yang melayani OpenAI, DeepSeek, OpenRouter, Groq, dan endpoint kustom kompatibel OpenAI (`CUSTOM_BASE_URL`).
- `AIManager` dengan caching instance provider, timeout via `AbortController`, retry dengan exponential backoff dan jitter untuk HTTP 429 pada request non-streaming, serta normalisasi galat provider menjadi pesan yang aman ditampilkan.
- Daftar model per provider (`src/config/models.js`) dan validasi pada `/model` dan `/setmodel`. Provider `custom` menerima nama model bebas.
- Penentuan provider dan model dengan urutan: override, pengaturan server, lalu default `.env`.

#### Sistem memori percakapan

- Penyimpanan percakapan di SQLite per kombinasi user, guild, dan channel.
- Pemangkasan otomatis setelah setiap respons sesuai `MAX_HISTORY_MESSAGES`. Hanya pesan terbaru yang dikirim ke provider.
- `/memory` untuk melihat status memori dan `/reset` untuk menghapus riwayat.
- Skema database: `guild_settings`, `user_settings`, `conversations`, `messages`, `usage_logs`, dengan foreign key dan cascade delete pada pesan.
- Penyimpanan memakai modul bawaan `node:sqlite` dalam mode WAL, tanpa dependensi native.

#### Streaming dan respons

- Streaming respons dengan pembaruan embed ber-throttle (1,5 detik) untuk menghindari rate limit Discord.
- Pemecahan respons panjang menjadi beberapa embed secara otomatis, dengan pemotongan pada batas baris atau spasi.
- Footer embed menampilkan model dan latency.
- Interaksi melalui slash command `/chat`, mention bot, dan reply ke pesan bot.

#### Perintah

- Perintah user: `/chat`, `/reset`, `/model`, `/models`, `/memory`, `/ping`, `/help`.
- Perintah admin: `/config`, `/setmodel`, `/setprompt`, `/setchannel`, `/maintenance`, `/stats`.
- Pemeriksaan permission admin (Manage Server atau Administrator) pada runtime.
- Pemuatan command dan event otomatis dari direktori, serta skrip `npm run deploy` untuk registrasi command bersifat guild atau global.

#### Anti-abuse dan batas penggunaan

- Cooldown per user (`USER_COOLDOWN`).
- Batas konkurensi per user (`MAX_CONCURRENT_REQUESTS`).
- Batas request harian per user (`DAILY_REQUEST_LIMIT`).
- Mode maintenance per server.
- Pencatatan penggunaan (provider, model, token, latency, status) dan statistik per server melalui `/stats`.

#### Keamanan dan operasional

- Validasi seluruh environment dengan Zod saat startup, dengan penghentian proses pada konfigurasi tidak valid atau tanpa API key.
- Seluruh query SQL memakai prepared statement.
- API key tidak disimpan di database maupun dikirim ke Discord.
- Logging terstruktur dengan pino dan redaksi field sensitif.
- Penanganan `unhandledRejection`, `uncaughtException`, dan `SIGINT`.
- Dukungan menjalankan di Windows, Linux, VPS, dan Termux Android tanpa Docker.
- Dokumentasi: `README.md`, `CONTRIBUTING.md`, `SECURITY.md`.

[Unreleased]: https://github.com/geoffreyoner/goomys-bot-ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/geoffreyoner/goomys-bot-ai/releases/tag/v1.0.0