// Logika skrining Rehat. Dipakai di client (UI) dan server (API route).
// Skor dan level risiko dihitung dengan ATURAN, bukan oleh AI,
// supaya hasilnya konsisten dan bisa dijelaskan.
// Pertanyaan mengacu pada instrumen PHQ-9 (skrining awal, bukan diagnosis).

export type Level = "rendah" | "sedang" | "tinggi";

export const OPSI = [
  "Tidak sama sekali",
  "Beberapa hari",
  "Lebih dari separuh waktu",
  "Hampir setiap hari",
]; // nilai 0..3

export const PERTANYAAN = [
  "Dalam 2 minggu terakhir, seberapa sering kamu kurang tertarik atau tidak senang melakukan banyak hal?",
  "Seberapa sering kamu merasa sedih, murung, atau putus asa?",
  "Seberapa sering kamu sulit tidur, sering terbangun, atau justru tidur terlalu banyak?",
  "Seberapa sering kamu merasa lelah atau kehilangan energi?",
  "Seberapa sering nafsu makanmu berkurang, atau kamu makan berlebihan?",
  "Seberapa sering kamu merasa buruk tentang dirimu, atau merasa gagal dan mengecewakan orang lain?",
  "Seberapa sering kamu sulit berkonsentrasi, misalnya saat membaca atau mengerjakan tugas?",
  "Seberapa sering kamu bergerak atau berbicara sangat lambat, atau justru gelisah dan sulit diam?",
  "Seberapa sering kamu terpikir bahwa lebih baik tidak ada, atau ingin menyakiti dirimu sendiri?",
];

// Label singkat tiap pertanyaan, dipakai untuk menjelaskan "kenapa skor ini".
export const LABEL = [
  "minat menurun",
  "suasana hati sedih",
  "pola tidur terganggu",
  "mudah lelah",
  "nafsu makan berubah",
  "merasa gagal",
  "sulit fokus",
  "gerak lambat atau gelisah",
  "pikiran menyakiti diri",
];

const IDX_PIKIRAN_MENYAKITI_DIRI = 8;

export function hitung(answers: number[]): {
  skor: number;
  level: Level;
  krisis: boolean;
} {
  const skor = answers.reduce((a, b) => a + b, 0); // 0..27
  // Jawaban apa pun selain "Tidak sama sekali" pada pertanyaan 9 = jalur krisis.
  const krisis = answers[IDX_PIKIRAN_MENYAKITI_DIRI] > 0;
  let level: Level = skor <= 4 ? "rendah" : skor <= 14 ? "sedang" : "tinggi";
  if (krisis) level = "tinggi";
  return { skor, level, krisis };
}

// Deteksi kata kunci krisis pada teks bebas. Berbasis aturan, tidak bergantung AI.
// Daftar ini TIDAK lengkap; tambahkan sesuai kebutuhan dan tinjau secara berkala.
const POLA_KRISIS = [
  /bunuh\s*diri/,
  /(meng)?akhiri\s*(hidup|nyawa)/,
  /(ingin|pengen|mau|pingin)\s*mati/,
  /lebih\s*baik\s*(aku\s*)?(mati|tidak\s*ada)/,
  /(tidak|nggak|gak|ga)\s*(ingin|mau|pengen)\s*hidup/,
  /(menyakiti|melukai|nyakitin)\s*diri/,
  /self[\s-]?harm/,
];

export function cekKataKrisis(teks: string): boolean {
  const t = teks.toLowerCase();
  return POLA_KRISIS.some((p) => p.test(t));
}