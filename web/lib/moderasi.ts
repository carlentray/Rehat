// Moderasi otomatis sederhana untuk Komunitas Anonim. Berbasis aturan, berjalan di server.
// Daftar ini TIDAK lengkap; tambahkan pola sesuai kebutuhan dan tinjau secara berkala.
import { cekKataKrisis } from "@/lib/triage";

export type HasilModerasi =
  | { status: "ok" }
  | { status: "krisis" }
  | { status: "ditolak"; pesan: string };

// Info pribadi dan tautan: mencegah doxxing, spam, dan identifikasi pengguna anonim.
const POLA_PRIBADI = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[\w.+-]+@[\w-]+\.[\w.]+\b/, // email
  /(\+?62|0)8\d[\d\s-]{7,}/, // nomor HP Indonesia
  /(^|\s)@\w{3,}/, // akun media sosial
];

export function moderasi(teks: string): HasilModerasi {
  // Konten krisis tidak dipublikasikan; pengguna diarahkan ke bantuan.
  if (cekKataKrisis(teks)) return { status: "krisis" };

  if (POLA_PRIBADI.some((p) => p.test(teks))) {
    return {
      status: "ditolak",
      pesan: "Demi keamanan, jangan sertakan link, nomor telepon, email, atau akun media sosial.",
    };
  }
  return { status: "ok" };
}