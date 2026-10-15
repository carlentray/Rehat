# Rehat (web)

Aplikasi web Rehat: pendamping kesehatan mental untuk mahasiswa. Dokumentasi produk lengkap ada di [README utama](../README.md). File ini khusus cara menjalankan folder `web/`.

## Prasyarat

- Node.js 20+
- Proyek Supabase (Auth, Postgres, RLS aktif)
- API key Gemini (untuk skrining dan insight)
- **Ollama** (untuk fitur Chat dengan Rehat, model berjalan lokal)

## 1. Install dependensi

```bash
cd web
npm install
```

## 2. Install Ollama dan model (fitur Chat)

Chat memakai model bahasa **lokal**, jadi percakapan tidak dikirim ke layanan cloud.

**Linux / macOS**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows**: unduh installer dari https://ollama.com/download

Lalu unduh model (sekali saja, ~2 GB):

```bash
ollama pull qwen2.5:3b-instruct
```

Tes model:

```bash
ollama run qwen2.5:3b-instruct "Aku capek banget minggu ini"
```

Pastikan server Ollama berjalan (biasanya otomatis setelah install). Kalau belum:

```bash
ollama serve
```

### Pilihan model

| Model | Unduhan | Catatan |
|---|---|---|
| `qwen2.5:1.5b-instruct` | ~1 GB | Paling cepat di CPU, kualitas bahasa lebih rendah |
| `qwen2.5:3b-instruct` | ~2 GB | **Default.** Cukup untuk RAM 8 GB |
| `qwen2.5:7b-instruct` | ~4,7 GB | Lebih natural dan patuh aturan, butuh RAM/VRAM lebih besar |

Ganti model lewat `OLLAMA_MODEL` di `.env.local`, lalu restart `npm run dev`.

### Tips performa

- Cek apakah model jalan di GPU atau CPU: `ollama ps` (lihat kolom `PROCESSOR`).
- Hilangkan cold start sebelum demo: `ollama run qwen2.5:3b-instruct "halo" --keepalive 1h`
- Ukur kecepatan: tambahkan `--verbose` dan lihat `eval rate` (di bawah ~5 token/detik terasa lambat).

## 3. Environment

Salin `.env.example` menjadi `.env.local`, lalu isi:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci publik (publishable) Supabase |
| `GEMINI_API_KEY` | Kunci Gemini. **Rahasia, jangan di-commit.** |
| `GEMINI_MODEL` | Model utama skrining/insight, mis. `gemini-flash-latest` |
| `GEMINI_FALLBACK_MODEL` | (opsional) Model cadangan |
| `OLLAMA_URL` | Alamat server Ollama. Default `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Model chat. Default `qwen2.5:3b-instruct` |

Env hanya dibaca saat server start. Setelah mengubah `.env.local`, jalankan ulang `npm run dev`.

## 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000. Halaman chat ada di `/chat`.

## Cara kerja Chat

```
/chat → POST /api/chat
  ├─ cek login + consent "Analisis AI"
  ├─ validasi input + rate limit (10 pesan/menit)
  ├─ frasa krisis      → kartu bantuan SEJIWA, model TIDAK dipanggil
  ├─ frasa ambigu      → balasan lembut tetap, model TIDAK dipanggil
  ├─ minta diagnosis   → balasan tetap, model TIDAK dipanggil
  ├─ di luar topik     → penolakan ramah, model TIDAK dipanggil
  ├─ Ollama (system prompt hanya dari server)
  └─ output guard      → jawaban bermasalah diganti teks aman
```

Prinsipnya: **hal yang berisiko ditangani aturan, bukan kepatuhan model.** Riwayat chat hanya ada di memori browser dan tidak disimpan ke database.

File terkait: `app/chat/page.tsx`, `app/api/chat/route.ts`, `lib/chat-safety.ts`, `lib/triage.ts` (pola krisis dan ambigu).

## Troubleshooting

| Masalah | Penyebab / solusi |
|---|---|
| "Rehat sedang tidak bisa dihubungi" | Ollama belum jalan. Jalankan `ollama serve`, cek `curl http://127.0.0.1:11434` |
| Jawaban sangat lambat | Kemungkinan CPU-only. Cek `ollama ps`, pakai model lebih kecil, atau warm-up model |
| Error `model not found` | Jalankan `ollama pull` dengan nama model yang sama seperti `OLLAMA_MODEL` |
| Chat menolak dengan pesan persetujuan | Aktifkan "Analisis AI" di halaman `/consent` |
| Error 429 | Terlalu banyak pesan; tunggu semenit |
| Perubahan `.env.local` tidak berlaku | Restart `npm run dev` |

## Catatan deploy

Chat butuh server Ollama yang bisa dijangkau dari server Next.js. `localhost:11434` **tidak bisa dijangkau dari Vercel**, jadi di deployment cloud fitur Chat tidak akan berfungsi kecuali `OLLAMA_URL` diarahkan ke server Ollama yang dapat diakses (VPS/GPU, atau tunnel sementara untuk demo). Endpoint Ollama tidak punya autentikasi bawaan, jangan dibiarkan terbuka ke publik. Fitur lain (check-in, insight, skrining, komunitas, dashboard) tidak bergantung pada Ollama.

Rate limit chat saat ini in-memory (cukup untuk satu instance). Untuk produksi/serverless, pindahkan ke Redis atau tabel Supabase.

## Perintah

```bash
npm run dev     # development
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # eslint
```
