# Panduan Kontribusi

Terima kasih atas minat berkontribusi pada Goomys Bot Discord AI. Dokumen ini menjelaskan cara menyiapkan lingkungan pengembangan, menambahkan provider AI baru, standar kode, dan alur pengiriman pull request.

## Menyiapkan Lingkungan Pengembangan

Prasyarat: Node.js 22.13 atau lebih baru dan Git.

```bash
git clone https://github.com/geoffreyoner/goomys-bot-ai.git
cd goomys-bot-ai
npm install
cp .env.example .env
```

Isi `.env` dengan token bot uji dan minimal satu API key. Gunakan aplikasi Discord khusus pengembangan dan isi `DISCORD_GUILD_ID` agar registrasi command berlangsung instan:

```bash
npm run deploy
npm start
```

Jangan pernah meng-commit `.env`, file `data/*.sqlite*`, atau log yang berisi data pengguna.

## Menambahkan Provider AI Baru

### Cara kerja pola adapter

Setiap provider adalah kelas yang mewarisi `BaseProvider` (`src/ai/providers/base.js`) dan mengimplementasikan dua metode. Lapisan di atasnya (`AIManager`, `aiInteraction`) hanya bergantung pada kontrak ini dan tidak mengetahui SDK provider.

| Metode | Input | Output |
|---|---|---|
| `chat({ messages, model, systemPrompt, signal })` | `messages`: array `{ role, content }` dengan `role` bernilai `user` atau `assistant` | `{ text, usage: { promptTokens, completionTokens } }` |
| `streamChat({ messages, model, systemPrompt, signal })` | Sama seperti `chat` | Async generator yang menghasilkan `{ text, usage }`. `usage` bernilai `null` jika belum tersedia. |

Ketentuan:

- `systemPrompt` dikirim terpisah dari `messages`. Adapter bertanggung jawab memetakannya ke format provider (pesan `system`, `systemInstruction`, dan sebagainya).
- `signal` (`AbortSignal`) bersifat opsional dan diteruskan ke SDK bila didukung.
- Adapter harus melempar error dengan properti `status` (HTTP status) bila tersedia. `AIManager.normalizeError` memakai `status` 401, 403, 429, dan 5xx untuk menghasilkan pesan yang dapat ditampilkan ke pengguna.
- Jangan menyertakan API key, header otorisasi, atau payload mentah pada pesan error maupun log.
- `registry` pada `src/ai/providers/index.js` mengembalikan nilai falsy jika API key kosong. Dengan begitu provider tanpa konfigurasi tidak muncul sebagai pilihan.

### Kasus 1: provider kompatibel OpenAI

Jika provider mendukung endpoint `chat.completions` ala OpenAI, tidak perlu kelas baru. Gunakan `OpenAICompatibleProvider`.

1. **Variabel environment.** Tambahkan ke `.env.example`:

   ```
   EXAMPLE_API_KEY=
   ```

2. **Validasi.** Pada `src/config/env.js`, tambahkan nama provider ke enum `DEFAULT_PROVIDER`, tambahkan field `EXAMPLE_API_KEY: z.string().optional()` pada skema, dan tambahkan pemetaan pada `keyMap`:

   ```js
   example: 'EXAMPLE_API_KEY'
   ```

3. **Registry.** Pada `src/ai/providers/index.js`:

   ```js
   example: () => env.EXAMPLE_API_KEY && new OpenAICompatibleProvider({
       name: 'example',
       apiKey: env.EXAMPLE_API_KEY,
       baseURL: 'https://api.example.com/v1',
       defaultModel: 'example-model-small',
       timeout: env.REQUEST_TIMEOUT
   })
   ```

4. **Daftar model.** Tambahkan entri pada `PROVIDER_MODELS` di `src/config/models.js`:

   ```js
   example: ['example-model-small', 'example-model-large']
   ```

   Array kosong berarti nama model apa pun diterima.

5. Perbarui `README.md` (tabel environment) dan `CHANGELOG.md`.

### Kasus 2: provider dengan SDK atau protokol sendiri

Buat berkas baru di `src/ai/providers/`, misalnya `example.js`:

```js
import { BaseProvider } from './base.js';

export class ExampleProvider extends BaseProvider {
    constructor(opts) {
        super(opts);
        this.name = 'example';
        this.defaultModel = 'example-model-small';
        // Inisialisasi klien SDK di sini, memakai this.apiKey dan this.timeout.
    }

    async chat({ messages, model, systemPrompt, signal }) {
        // Panggil API, lalu petakan hasilnya.
        return {
            text: '',
            usage: { promptTokens: 0, completionTokens: 0 }
        };
    }

    async *streamChat({ messages, model, systemPrompt, signal }) {
        // Untuk setiap potongan dari provider:
        yield { text: '', usage: null };
        // Pada akhir stream, jika provider melaporkan penggunaan token:
        // yield { text: '', usage: { promptTokens, completionTokens } };
    }
}
```

Lalu daftarkan seperti pada Kasus 1 langkah 1 sampai 5, dengan `new ExampleProvider({ apiKey, timeout })` pada registry.

Acuan implementasi: `gemini.js` (pemetaan role `assistant` menjadi `model` dan tool bawaan provider) dan `openaiCompatible.js` (streaming berbasis chunk dengan laporan penggunaan token).

### Checklist provider baru

- Provider tidak aktif dan tidak muncul di `/model` bila API key kosong.
- `chat` dan `streamChat` mengikuti bentuk output pada tabel di atas.
- Error membawa `status` HTTP bila tersedia.
- Tidak ada kunci atau data sensitif pada log maupun pesan error.
- Dokumentasi dan changelog diperbarui.

## Menambahkan Slash Command

Berkas di `src/bot/commands/` (rekursif) dimuat otomatis jika mengekspor `data` dan `execute`. Command admin diletakkan di `src/bot/commands/admin/` dan wajib mengekspor `adminOnly = true`.

```js
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const adminOnly = false;

export const data = new SlashCommandBuilder()
    .setName('contoh')
    .setDescription('Deskripsi singkat');

export async function execute(interaction) {
    await interaction.reply({ content: 'OK', flags: MessageFlags.Ephemeral });
}
```

Error yang dilempar dari `execute` ditangkap oleh `interactionCreate.js` dan ditampilkan sebagai embed galat. Gunakan pesan yang aman ditampilkan ke pengguna. Jalankan `npm run deploy` setelah menambah atau mengubah command.

## Gaya Penulisan Kode

- **ES Modules**: gunakan `import` dan `export`. Tidak ada `require`. Sertakan ekstensi `.js` pada impor relatif dan awalan `node:` untuk modul bawaan Node.js.
- **Format**: indentasi 4 spasi, tanda kutip tunggal, titik koma di akhir pernyataan.
- **Ekspor**: gunakan named export, kecuali ada alasan kuat.
- **Asinkron**: gunakan `async`/`await`. Hindari rantai `.then` yang dalam.
- **Fungsi kecil dan terfokus**: satu tanggung jawab per fungsi. Pisahkan akses data (`database/repositories`), logika (`services`, `ai`), dan antarmuka Discord (`bot`).
- **Akses database**: selalu gunakan prepared statement dengan parameter binding. Dilarang menyusun SQL dengan interpolasi string dari input pengguna.
- **Konfigurasi**: baca environment hanya melalui `src/config/env.js`. Jangan mengakses `process.env` langsung di modul lain.
- **Logging**: gunakan `logger` dari `services/logger.js` dengan objek terstruktur berkunci `event`, misalnya `logger.warn({ event: 'nama_event', ... })`. Jangan memakai `console.log` pada kode aplikasi.
- **Error**: lempar `Error` dengan pesan yang aman bagi pengguna. Jangan membocorkan kunci, token, atau isi respons mentah provider.
- **Penamaan**: `camelCase` untuk variabel dan fungsi, `PascalCase` untuk kelas, `UPPER_SNAKE_CASE` untuk konstanta, dan nama file command sama dengan nama command.
- **Komentar**: tulis komentar hanya untuk menjelaskan alasan, bukan mengulang isi kode.
- **Dependensi**: tambahkan dependensi baru hanya jika benar-benar diperlukan dan jelaskan alasannya di pull request.

## Pengujian

Test memakai test runner bawaan Node.js:

```bash
npm test
npm run test:integration
```

Letakkan unit test di `tests/unit/` dan integration test di `tests/integration/` dengan akhiran `.test.js`. Berkas di direktori tersebut saat ini belum berisi kasus uji, sehingga kontribusi pengujian sangat diterima, terutama untuk `splitter`, `validator`, `rateLimiter`, `memory`, dan adapter provider. Test tidak boleh memerlukan API key asli atau koneksi jaringan; gunakan stub untuk panggilan ke provider.

## Mengirim Pull Request

1. Cari issue yang sudah ada atau buka issue baru untuk mendiskusikan perubahan besar sebelum mulai menulis kode.
2. Fork repositori dan buat branch dari `main`:

   ```bash
   git checkout -b feat/nama-fitur
   ```

   Awalan branch yang disarankan: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`.
3. Buat perubahan yang terfokus. Satu pull request untuk satu tujuan.
4. Gunakan format commit [Conventional Commits](https://www.conventionalcommits.org/), misalnya:

   ```
   feat(providers): tambah adapter Example
   fix(memory): perbaiki pemangkasan saat riwayat kosong
   docs: perbarui tabel environment
   ```

5. Pastikan `npm test` lulus dan bot dapat dijalankan secara lokal.
6. Perbarui `README.md` dan `CHANGELOG.md` (bagian `Unreleased`) jika perubahan memengaruhi perilaku, konfigurasi, atau perintah.
7. Push branch dan buka pull request ke `main`. Deskripsi pull request memuat:
   - tujuan dan ringkasan perubahan,
   - cara menguji,
   - dampak pada konfigurasi atau skema database,
   - issue terkait (`Closes #123`).
8. Tanggapi umpan balik reviewer dengan commit tambahan. Maintainer dapat melakukan squash saat merge.

### Checklist pull request

- Kode mengikuti gaya penulisan di atas.
- Tidak ada secret, token, atau data pengguna pada diff.
- Query SQL memakai parameter binding.
- Dokumentasi dan changelog diperbarui bila perlu.
- Perubahan skema database kompatibel dengan data yang sudah ada (`CREATE ... IF NOT EXISTS` atau migrasi yang eksplisit).

## Melaporkan Bug dan Mengusulkan Fitur

Buka issue dengan menyertakan versi Node.js, sistem operasi, provider dan model yang dipakai, langkah reproduksi, serta log yang sudah dibersihkan dari secret. Kerentanan keamanan tidak dilaporkan lewat issue publik. Ikuti [SECURITY.md](SECURITY.md).