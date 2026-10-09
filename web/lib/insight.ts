// Analisis check-in mingguan Rehat.
// Skor stres dihitung dengan ATURAN (bisa dijelaskan), bukan oleh AI.
// AI hanya dipakai untuk menjelaskan pola dalam bahasa yang hangat.

export type Level = "rendah" | "sedang" | "tinggi";
export type Checkin = { tanggal: string; mood: number; tidur: number; energi: number };
export type Analisis = {
  skor: number; // 0..100
  level: Level;
  alasan: string[];
  rataTidur: number;
  rataMood: number;
};

export const MIN_HARI = 3;

// "YYYY-MM-DD" menurut zona waktu perangkat (bukan UTC).
export const tanggalLokal = (d: Date) => d.toLocaleDateString("sv-SE");

const rata = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const klem = (n: number) => Math.min(1, Math.max(0, n));
const koma = (n: number) => n.toFixed(1).replace(".", ",");

export function analisis(data: Checkin[]): Analisis | null {
  if (data.length < MIN_HARI) return null;
  const d = [...data].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const rataTidur = rata(d.map((x) => x.tidur));
  const rataMood = rata(d.map((x) => x.mood));
  const rataEnergi = rata(d.map((x) => x.energi)); // 1..3

  // Bobot: tidur 40, mood 40, energi 20.
  const skor = Math.round(
    klem((7 - rataTidur) / 3) * 40 +
      klem((5 - rataMood) / 4) * 40 +
      klem((3 - rataEnergi) / 2) * 20
  );
  const level: Level = skor < 35 ? "rendah" : skor < 65 ? "sedang" : "tinggi";

  const alasan: string[] = [];
  if (rataTidur < 6.5) alasan.push(`Tidur rata-rata ${koma(rataTidur)} jam (target 7 jam)`);

  let streak = 0;
  for (let i = d.length - 1; i > 0; i--) {
    if (d[i].mood < d[i - 1].mood) streak++;
    else break;
  }
  if (streak >= 2) alasan.push(`Mood turun ${streak} hari berturut-turut`);
  else if (rataMood <= 2.5) alasan.push(`Mood rata-rata rendah (${koma(rataMood)} dari 5)`);

  const hariLemas = d.filter((x) => x.energi === 1).length;
  if (hariLemas >= 3) alasan.push(`Energi rendah ${hariLemas} dari ${d.length} hari`);

  if (alasan.length === 0) alasan.push("Tidak ada pola mengkhawatirkan minggu ini");

  return { skor, level, alasan, rataTidur, rataMood };
}