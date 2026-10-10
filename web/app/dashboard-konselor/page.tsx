"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthGate } from "../../lib/use-auth-gate";

type Data =
  | { cukup: false; minimum: number }
  | {
      cukup: true;
      peserta: number;
      total_checkin: number;
      rata_mood: number | null;
      rata_tidur: number | null;
      sebaran: { rendah: number; sedang: number; tinggi: number };
      tren: { tanggal: string; rata_mood: number | null }[];
    };

const RISIKO = [
  { kunci: "rendah", label: "Rendah", warna: "bg-[#2f7f73]" },
  { kunci: "sedang", label: "Sedang", warna: "bg-[#f2c27b]" },
  { kunci: "tinggi", label: "Tinggi", warna: "bg-[#b3261e]" },
] as const;

const koma = (n: number | null) => (n === null ? "–" : String(n).replace(".", ","));

export default function DashboardKonselorPage() {
  const router = useRouter();
  const { profile, loading } = useAuthGate();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    // Pemeriksaan di sisi tampilan. Perlindungan sebenarnya ada di fungsi SQL.
    if (profile?.role !== "counselor") {
      router.replace("/");
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("dashboard_konselor");
      if (error) {
        console.error("Dashboard gagal:", error);
        if (error.message.includes("tidak diizinkan")) router.replace("/");
        else setError("Data dashboard belum bisa dimuat.");
        return;
      }
      setData(data as Data);
    })();
  }, [loading, profile, router]);

  async function keluar() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || (!data && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-10 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="space-y-1.5 px-6 pt-14">
        <h1 className="text-[26px] font-bold text-[#1f2d2a]">Dashboard Konselor</h1>
        <p className="text-sm text-[#5b6b66]">Data agregat anonim · 7 hari terakhir</p>
      </header>

      <div className="space-y-4 px-6 pt-4">
        {error && (
          <p role="alert" className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]">
            {error}
          </p>
        )}

        {data && !data.cukup && (
          <section className="space-y-2 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
            <h2 className="text-lg font-bold text-[#1f2d2a]">Data belum cukup</h2>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              Demi menjaga anonimitas, angka baru ditampilkan jika minimal {data.minimum} mahasiswa
              mengaktifkan berbagi data anonim dan melakukan check-in dalam 7 hari terakhir.
            </p>
          </section>
        )}

        {data && data.cukup && (() => {
          const total = data.sebaran.rendah + data.sebaran.sedang + data.sebaran.tinggi;
          const persenTinggi = total ? Math.round((data.sebaran.tinggi / total) * 100) : null;
          return (
            <>
              <div className="flex gap-3">
                <section className="flex-1 space-y-1 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                  <p className="text-xs font-bold text-[#2f7f73]">CHECK-IN</p>
                  <p className="text-[32px] font-bold leading-none text-[#1f2d2a]">{data.total_checkin}</p>
                  <p className="text-xs text-[#5b6b66]">dari {data.peserta} mahasiswa</p>
                </section>
                <section className="flex-1 space-y-1 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                  <p className="text-xs font-bold text-[#2f7f73]">RISIKO TINGGI</p>
                  <p className="text-[32px] font-bold leading-none text-[#b3261e]">
                    {persenTinggi === null ? "–" : `${persenTinggi}%`}
                  </p>
                  <p className="text-xs text-[#5b6b66]">dari yang skrining</p>
                </section>
              </div>

              <section className="space-y-3 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                <h2 className="text-lg font-bold text-[#1f2d2a]">Tren mood harian</h2>
                <div className="flex h-28 items-end justify-between gap-2" role="img" aria-label="Rata-rata mood per hari">
                  {data.tren.map((t) => (
                    <div key={t.tanggal} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold text-[#1f2d2a]">{koma(t.rata_mood)}</span>
                      <div
                        className="w-full max-w-[26px] rounded-t-md bg-[#2f7f73]"
                        style={{
                          height: t.rata_mood === null ? "4px" : `${(t.rata_mood / 5) * 72}px`,
                          opacity: t.rata_mood === null ? 0.2 : 1,
                        }}
                      />
                      <span className="text-[11px] text-[#8a9893]">
                        {new Date(t.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#5b6b66]">
                  Rata-rata tidur {koma(data.rata_tidur)} jam · rata-rata mood {koma(data.rata_mood)} dari 5
                </p>
              </section>

              <section className="space-y-3 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                <h2 className="text-lg font-bold text-[#1f2d2a]">Sebaran risiko</h2>
                {RISIKO.map((r) => {
                  const n = data.sebaran[r.kunci];
                  return (
                    <div key={r.kunci} className="flex items-center gap-2.5">
                      <span className="w-14 text-sm text-[#5b6b66]">{r.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e1e8e5]">
                        <div className={`h-full rounded-full ${r.warna}`} style={{ width: total ? `${(n / total) * 100}%` : "0%" }} />
                      </div>
                      <span className="w-6 text-right text-sm font-semibold text-[#1f2d2a]">{n}</span>
                    </div>
                  );
                })}
                <p className="text-xs text-[#8a9893]">
                  Dari skrining terakhir mahasiswa yang menyetujui berbagi data.
                </p>
              </section>
            </>
          );
        })()}

        <p className="text-center text-xs leading-relaxed text-[#8a9893]">
          Tampilan konselor · hanya data agregat dari mahasiswa yang menyetujui berbagi. Kelompok kecil
          tidak ditampilkan.
        </p>

        <button
          type="button"
          onClick={keluar}
          className="w-full py-2 text-center text-sm font-semibold text-[#5b6b66] underline"
        >
          Keluar Akun
        </button>
      </div>
    </main>
  );
}