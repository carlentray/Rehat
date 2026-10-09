"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { analisis, tanggalLokal, MIN_HARI, type Checkin, type Level } from "@/lib/insight";
import { useAuthGate } from "../../lib/use-auth-gate";
import { BottomNav } from "../../components/bottomnav";

const GAYA: Record<Level, { label: string; chip: string; bar: string }> = {
  rendah: { label: "Rendah", chip: "bg-[#dcf1e6] text-[#1f5f55]", bar: "bg-[#2f7f73]" },
  sedang: { label: "Sedang", chip: "bg-[#ffebc8] text-[#9a5b00]", bar: "bg-[#f2c27b]" },
  tinggi: { label: "Tinggi", chip: "bg-[#ffd9d6] text-[#b3261e]", bar: "bg-[#b3261e]" },
};

const LATIHAN = [
  { menit: "3 menit", judul: "Latihan napas 4-7-8" },
  { menit: "5 menit", judul: "Grounding 5-4-3-2-1" },
];

// 7 hari terakhir, dari paling lama ke hari ini.
function tujuhHari(): Date[] {
  const hariIni = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hariIni);
    d.setDate(hariIni.getDate() - (6 - i));
    return d;
  });
}

export default function InsightPage() {
  const { loading } = useAuthGate();
  const [data, setData] = useState<Checkin[] | null>(null);
  const [pola, setPola] = useState<string | null>(null);
  
  // 1. Buat state untuk tanggal agar aman dari Hydration Mismatch
  const [hari, setHari] = useState<Date[]>([]);
  const [rentang, setRentang] = useState("");

  // 2. Inisialisasi tanggal hanya saat komponen dimuat di browser
  useEffect(() => {
    const h = tujuhHari();
    setHari(h);
    setRentang(
      `${h[0].toLocaleDateString("id-ID", { day: "numeric", month: "long" })} – ${h[6].toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`
    );
  }, []);

  // 3. Ambil data dari Supabase (tunggu sampai state 'hari' terisi)
  useEffect(() => {
    if (loading || hari.length === 0) return;
    let batal = false;
    (async () => {
      const { data: baris } = await supabase
        .from("checkins")
        .select("tanggal, mood, tidur, energi")
        .gte("tanggal", tanggalLokal(hari[0]))
        .order("tanggal");
      
      if (batal) return;
      const rows = (baris ?? []) as Checkin[];
      setData(rows);

      if (rows.length >= MIN_HARI) {
        try {
          const res = await fetch("/api/insight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: rows }),
          });
          const j = await res.json();
          if (!batal && typeof j.pola === "string") setPola(j.pola);
        } catch {
          /* abaikan jika gagal */
        }
      }
    })();
    return () => {
      batal = true;
    };
  }, [loading, hari]);

  // 4. Cegah render UI sebelum data dan tanggal siap
  if (loading || data === null || hari.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat Insight...</p>
      </main>
    );
  }

  const hasil = analisis(data);
  const peta = new Map(data.map((d) => [d.tanggal, d]));

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
      <div className="space-y-4 px-6 pt-14">
        <header className="space-y-1.5">
          <h1 className="text-[26px] font-bold text-[#1f2d2a]">Insight Mingguan</h1>
          <p className="text-sm text-[#5b6b66]">{rentang}</p>
        </header>

        {/* Tren */}
        <section className="space-y-3 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
          <h2 className="text-lg font-bold text-[#1f2d2a]">Tren mood &amp; tidur</h2>
          <div className="flex h-32 items-end justify-between gap-2" role="img" aria-label="Grafik mood dan tidur 7 hari terakhir">
            {hari.map((d) => {
              const c = peta.get(tanggalLokal(d));
              return (
                <div key={d.toISOString()} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-24 w-full items-end justify-center gap-1">
                    <div
                      className="w-3 rounded-t-md bg-[#2f7f73]"
                      style={{ height: c ? `${(c.mood / 5) * 100}%` : "4px", opacity: c ? 1 : 0.2 }}
                    />
                    <div
                      className="w-3 rounded-t-md bg-[#9cd3c6]"
                      style={{ height: c ? `${Math.min(100, (c.tidur / 9) * 100)}%` : "4px", opacity: c ? 1 : 0.2 }}
                    />
                  </div>
                  <span className="text-[11px] text-[#8a9893]">
                    {d.toLocaleDateString("id-ID", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-[#5b6b66]">
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#2f7f73]" /> Mood
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#9cd3c6]" /> Tidur
            </span>
          </div>
        </section>

        {!hasil ? (
          <section className="space-y-3 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
            <h2 className="text-lg font-bold text-[#1f2d2a]">Datamu belum cukup</h2>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              Rehat butuh minimal {MIN_HARI} hari check-in dalam seminggu untuk membaca polamu. Kamu
              sudah check-in {data.length} hari.
            </p>
            <Link
              href="/"
              className="block w-full rounded-2xl bg-[#2f7f73] py-[15px] text-center text-[15px] font-semibold text-white"
            >
              Check-in sekarang
            </Link>
          </section>
        ) : (
          <>
            {/* Skor stres */}
            <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1f2d2a]">Skor stres</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GAYA[hasil.level].chip}`}>
                  {GAYA[hasil.level].label}
                </span>
              </div>
              <p className="text-[32px] font-bold leading-none text-[#1f2d2a]">
                {hasil.skor} <span className="text-base font-semibold text-[#8a9893]">/ 100</span>
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e8e5]">
                <div className={`h-full rounded-full ${GAYA[hasil.level].bar}`} style={{ width: `${hasil.skor}%` }} />
              </div>
              <p className="pt-1 text-xs font-bold text-[#2f7f73]">KENAPA SKOR INI?</p>
              <ul className="space-y-1 text-sm leading-relaxed text-[#5b6b66]">
                {hasil.alasan.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </section>

            {/* Penjelasan AI */}
            {pola && (
              <section className="space-y-2 rounded-[20px] border border-[#9cd3c6] bg-[#d8eeea] p-[18px]">
                <p className="text-xs font-bold text-[#1f5f55]">POLA YANG TERLIHAT · DIBUAT AI</p>
                <p className="text-sm leading-relaxed text-[#1f2d2a]">{pola}</p>
              </section>
            )}

            {hasil.level === "tinggi" && (
              <section className="space-y-2 rounded-[20px] border border-[#ffe2a8] bg-[#fff6e5] p-[18px]">
                <p className="text-sm leading-relaxed text-[#5b6b66]">
                  Skormu cukup tinggi minggu ini. Bicara dengan konselor bisa membantu.
                </p>
                <Link
                  href="/konselor"
                  className="block w-full rounded-2xl border-[1.5px] border-[#9a5b00] bg-white py-[13px] text-center text-[15px] font-semibold text-[#9a5b00]"
                >
                  Lihat Konselor
                </Link>
              </section>
            )}
          </>
        )}

        {/* Tindakan awal */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1f2d2a]">Tindakan awal untukmu</h2>
          {LATIHAN.map((l) => (
            <div
              key={l.judul}
              className="flex items-center justify-between rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]"
            >
              <span className="text-[15px] font-semibold text-[#1f2d2a]">{l.judul}</span>
              <span className="rounded-full bg-[#d8eeea] px-3 py-1 text-xs font-semibold text-[#2f7f73]">
                {l.menit}
              </span>
            </div>
          ))}
        </section>

        <p className="pb-2 text-center text-xs text-[#8a9893]">
          Skor ini bukan diagnosis. Hanya angka check-in yang dikirim ke AI; jurnalmu tidak.
        </p>
      </div>
      <BottomNav />
    </main>
  );
}