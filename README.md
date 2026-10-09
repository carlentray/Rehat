# Rehat

**Teman harian untuk mengenali stres lebih awal, sebelum jadi burnout.**

Rehat adalah aplikasi web (PWA) pendamping kesehatan mental untuk mahasiswa. Rehat membantu memantau kondisi harian, mengenali pola stres, melakukan skrining awal lewat chat, dan terhubung ke konselor bila perlu.

> Rehat adalah alat skrining awal, **bukan diagnosis**. Keputusan akhir selalu ada di konselor atau psikolog.

## Masalah

Mahasiswa sering baru sadar mengalami stres berat atau burnout ketika kondisinya sudah parah. Penyebabnya antara lain stigma, tidak tahu harus mulai dari mana, dan layanan konseling yang baru dicari saat sudah krisis.

## Target Pengguna

- **Utama:** mahasiswa
- **Pihak kedua:** konselor/psikolog kampus (melihat data agregat anonim)

## Alur Utama

Check-in harian → insight pola stres → AI triage (PHQ-9 dalam bentuk chat) → level risiko → rekomendasi tindakan atau rujukan → dashboard konselor

## Fitur

- Check-in harian (mood, tidur, energi, jurnal singkat)
- Grafik tren dan skor stres yang bisa dijelaskan
- AI triage chat berbasis PHQ-9 (skor dihitung dengan rumus, bukan oleh LLM)
- Tindakan awal: latihan napas 4-7-8 dan grounding 5-4-3-2-1
- Rujukan ke konselor (via WhatsApp)
- Dashboard konselor (agregat anonim)
- Forum komunitas anonim (versi minimal)

## Keamanan dan Etika

- Persetujuan data aktif dari pengguna, data diolah anonim, mengacu pada UU PDP
- Deteksi kata kunci krisis berbasis aturan (tidak bergantung pada LLM)
- Jawaban PHQ-9 nomor 9 langsung memicu layar bantuan darurat
- Prinsip human-in-the-loop: AI hanya untuk triage

## Tech Stack

Next.js, Tailwind CSS, shadcn/ui, Recharts, Supabase (Postgres, Auth, RLS), Claude/Gemini API, Vercel, Figma

## Menjalankan Secara Lokal

```bash
cd web
npm install
npm run dev
```

Salin `.env.example` menjadi `.env.local`, lalu isi variabelnya.

## Tim

- (nama) - UI/UX dan pitch
- (nama) - Frontend
- (nama) - Backend dan database
- (nama) - AI dan safety logic
