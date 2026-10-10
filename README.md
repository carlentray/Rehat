# Rehat

**Teman harian untuk mengenali stres lebih awal, sebelum jadi burnout.**

Rehat adalah aplikasi web pendamping kesehatan mental untuk mahasiswa. Rehat membantu memantau kondisi harian, mengenali pola stres, melakukan skrining awal lewat chat, dan terhubung ke konselor bila perlu.

> Rehat adalah alat skrining awal, **bukan diagnosis** dan **bukan layanan darurat medis**. Keputusan akhir selalu ada di konselor atau psikolog. Jika kamu atau seseorang dalam bahaya, hubungi **SEJIWA: telepon 119 lalu tekan 8**.

Dibuat untuk **JOINTS 2026** (healthcare).

| | |
|---|---|
| Prototype Figma | https://www.figma.com/design/sygzJQyqqXBKH2Sfjn21N3/Rehat---Mental-Health-Companion--JOINTS-2026- |
| Video demo | _TODO: tautan YouTube_ |
| Pitch deck | _TODO: tautan atau `docs/pitch-deck.pdf`_ |

## Masalah

Mahasiswa sering baru sadar mengalami stres berat atau burnout ketika kondisinya sudah parah. Penyebabnya antara lain stigma, tidak tahu harus mulai dari mana, dan layanan konseling yang baru dicari saat sudah krisis.

## Target Pengguna

- **Utama:** mahasiswa
- **Pihak kedua:** konselor/psikolog kampus (melihat data agregat anonim)

## Alur Utama

Check-in harian → insight pola stres → AI triage (PHQ-9 dalam bentuk chat) → level risiko → rekomendasi tindakan atau rujukan → dashboard konselor

## Tampilan Aplikasi (Mockup Figma)

| Login / Daftar | Persetujuan Data |
|:--:|:--:|:--:|
| <img width="329" height="693" alt="image" src="https://github.com/user-attachments/assets/970c67a0-6e1b-4e21-a5a7-d7c2728fbeff" />
 | <img width="323" height="689" alt="image" src="https://github.com/user-attachments/assets/b2849dde-0e42-4997-a504-db39811d8a81" />
 |

| Beranda Check-in | Insight Mingguan | AI Triage Chat |
|:--:|:--:|:--:|
| <img width="322" height="692" alt="image" src="https://github.com/user-attachments/assets/e56ba311-eac9-4e8e-8fdf-c787510ba5c6" />
 | <img width="323" height="687" alt="image" src="https://github.com/user-attachments/assets/da57b42d-fbde-428d-8314-4a10e30f2021" />
 | <img width="325" height="690" alt="image" src="https://github.com/user-attachments/assets/0af0f853-9d54-4e52-ab30-ad54a57fe449" />
 |

| Hasil Skrining | Rujukan Konselor | Komunitas Anonim |
|:--:|:--:|:--:|
| <img width="319" height="686" alt="image" src="https://github.com/user-attachments/assets/1623e351-d867-4443-a220-f09ca5617043" />
 | <img width="331" height="696" alt="image" src="https://github.com/user-attachments/assets/2f76639e-8540-43a7-9ba4-bdf1fae26fae" />
 | <img width="332" height="694" alt="image" src="https://github.com/user-attachments/assets/a5e0823f-ee92-4f38-8951-64ec2590c2ac" />
 |

| Bantuan Darurat | Dashboard Konselor |
|:--:|:--:|
| <img width="327" height="688" alt="image" src="https://github.com/user-attachments/assets/04b03d42-bebd-4cb8-9e3c-a73fa2594bbf" />
 | <img width="333" height="693" alt="image" src="https://github.com/user-attachments/assets/773a74fd-e639-4bf4-984a-196a1d79410e" />
 |

## Fitur

- **Akun dan masuk anonim:** daftar dengan email, atau masuk sebagai anonim tanpa email
- **Persetujuan data (consent):** tiga pilihan terpisah (simpan check-in [wajib], analisis AI, berbagi data anonim ke konselor). Bisa memilih "Hanya yang wajib"
- **Check-in harian:** mood, tidur, energi, jurnal singkat (satu per hari)
- **Insight mingguan:** grafik tren dan skor stres 0 sampai 100 yang bisa dijelaskan, dihitung dengan aturan
- **AI triage chat berbasis PHQ-9:** 9 pertanyaan dengan jawaban berupa tombol. Skor dan level risiko dihitung dengan rumus, bukan oleh LLM
- **Jalur krisis:** layar bantuan darurat (SEJIWA 119 ext. 8) tanpa memanggil AI
- **Tindakan awal:** latihan grounding 5-4-3-2-1 di halaman Bantuan, serta saran latihan napas pada hasil skrining
- **Rujukan ke konselor** (via WhatsApp), lengkap dengan jadwal
- **Dashboard konselor:** data agregat anonim, hanya dari mahasiswa yang menyetujui berbagi
- **Forum komunitas anonim** (versi minimal): posting, dukungan, komentar, dengan moderasi otomatis
- **Bantuan darurat:** bisa dibuka tanpa login

## Bagaimana AI Dipakai (dan Tidak Dipakai)

Prinsip desain: **keputusan risiko tidak diserahkan ke AI.**

- **Skor dan level risiko dihitung dengan aturan** (`lib/triage.ts`, `lib/insight.ts`), sehingga hasilnya konsisten dan bisa dijelaskan.
- **AI hanya menerjemahkan hasil menjadi bahasa yang hangat:** ringkasan singkat dan saran kecil. Prompt melarang diagnosis, penyebutan nama gangguan, penebakan penyebab, dan saran obat.
- **Jalur krisis bersifat deterministik.** Saat terdeteksi, respons tetap ditampilkan dan AI tidak dipanggil.
- **AI mengikuti consent.** Server memeriksa persetujuan `ai_triage` sebelum memanggil Gemini. Jika dimatikan, hasil memakai teks standar.
- **Data yang dikirim ke AI minimal.** Skrining mengirim skor, level, dan hal yang sering dirasakan. Insight hanya mengirim angka (mood, tidur, energi). **Jurnal tidak dikirim.**
- **Ada cadangan.** Jika AI gagal atau penuh, aplikasi mencoba model cadangan, lalu memakai teks standar.

### Transparansi penggunaan AI dalam pengembangan

Tim memakai asisten AI (**Claude** dari Anthropic dan **Gemini** dari Google) selama pengembangan untuk brainstorming konsep, penyusunan desain, dan bantuan penulisan kode. _TODO: pastikan kalimat ini akurat untuk seluruh tim dan sesuai aturan lomba._

## Keamanan dan Etika

- Persetujuan data aktif dari pengguna, data diolah anonim, mengacu pada UU PDP
- Deteksi kata kunci krisis berbasis aturan (tidak bergantung pada LLM)
- Jawaban PHQ-9 nomor 9 langsung memicu layar bantuan darurat
- Prinsip human-in-the-loop: AI tidak mengambil keputusan risiko, keputusan akhir di konselor atau psikolog
- **Row Level Security** aktif di tabel data pengguna; setiap pengguna hanya bisa membaca dan menulis datanya sendiri
- **Komunitas anonim:** data publik dibaca lewat *view* tanpa `user_id`, sehingga pengguna lain tidak bisa melihat siapa penulisnya. Penulis bisa menghapus tulisannya sendiri
- **Dashboard konselor:** diakses lewat fungsi SQL yang hanya mengembalikan angka agregat, hanya dari pengguna yang menyetujui berbagi, dan menolak mengembalikan angka jika peserta di bawah batas minimum
- **Peran (`role`) dilindungi trigger**, sehingga pengguna tidak bisa menaikkan dirinya sendiri menjadi konselor
- **Teks bebas di skrining tidak disimpan**, hanya skor dan level
- **Moderasi komunitas** berjalan di server: konten krisis tidak dipublikasikan dan tidak disimpan (pengguna diarahkan ke bantuan); tautan, nomor telepon, email, dan akun media sosial ditolak

## Tech Stack

Next.js 16, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, RLS), Gemini API, Figma. Deploy: _TODO (mis. Vercel)_.

## Menjalankan Secara Lokal

Prasyarat: Node.js 20+, proyek Supabase, dan API key Gemini.

```bash
git clone https://github.com/carlentray/Rehat.git
cd Rehat/web
npm install
npm run dev
```

Salin `.env.example` menjadi `.env.local`, lalu isi variabelnya:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci publik (publishable) Supabase |
| `GEMINI_API_KEY` | Kunci Gemini. **Rahasia, jangan di-commit.** |
| `GEMINI_MODEL` | Model utama, mis. `gemini-flash-latest` |
| `GEMINI_FALLBACK_MODEL` | (opsional) Model cadangan, mis. `gemini-flash-lite-latest` |

Buka http://localhost:3000.

### Database

Tabel yang dipakai: `profiles`, `consents`, `checkins`, `triage_results`, `counselors`, `community_posts`, `community_comments`, `community_supports`. SQL ada di folder `database/` (mis. `dashboard-konselor.sql`). **Pastikan RLS aktif di semua tabel**, dan aktifkan *Anonymous sign-ins* di Supabase (Authentication → Sign In / Providers) agar tombol "Masuk sebagai Anonim" berfungsi.

Menjadikan sebuah akun sebagai konselor:

```sql
update public.profiles set role = 'counselor'
where id = (select id from auth.users where email = 'email-konselor@contoh.com');
```

## Catatan Data Demo

- **Konselor** di aplikasi demo adalah anggota tim dengan label "Konselor Demo", **bukan** psikolog atau konselor berlisensi. Pada penggunaan nyata, daftar ini diisi konselor kampus terdaftar.
- **Angka di dashboard konselor** pada demo sebagian berasal dari **akun simulasi** (`@demo.rehat.test`) agar grafik terisi. Akun tersebut bukan pengguna sungguhan.

## Keterbatasan

- **Belum divalidasi secara klinis.** Pertanyaan mengacu pada PHQ-9 yang diadaptasi, tetapi aplikasi ini belum ditinjau oleh tenaga profesional dan tidak menggantikan penilaian mereka.
- **Moderasi masih dasar.** Berbasis aturan (krisis, tautan, info pribadi). Ujaran kebencian dan pelecehan belum tersaring, dan belum ada tombol "Laporkan".
- **Daftar kata kunci krisis tidak lengkap** dan perlu ditinjau berkala oleh profesional.
- **Dashboard belum menyamarkan angka kecil per kategori.** Batas minimum baru melindungi total peserta (3 pada demo, 5 disarankan untuk produksi).
- **Anonim terhadap pengguna lain, bukan anonim total.** Data tetap terhubung ke akun demi keamanan dan moderasi; hanya admin basis data yang secara teknis bisa mengaksesnya.
- **Bergantung pada layanan AI eksternal.** Jika Gemini tidak tersedia, aplikasi memakai teks standar.
- Peran konselor saat ini ditetapkan manual lewat SQL.

## Rencana Pengembangan

- Tinjauan klinis atas pertanyaan, ambang risiko, dan teks bantuan oleh psikolog/konselor
- Tombol "Laporkan" dan moderasi yang lebih kuat untuk komunitas
- Penyamaran angka kecil di dashboard dan ambang produksi yang lebih ketat
- Halaman Profil: ubah consent dan hapus data sendiri
- Latihan napas 4-7-8 di dalam aplikasi, notifikasi pengingat check-in
- Integrasi dengan layanan konseling kampus

## Tim

- (nama) - UI/UX dan pitch
- (nama) - Frontend
- (nama) - Backend dan database
- (nama) - AI dan safety logic
