"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { tanggalLokal } from "@/lib/insight";
import { useAuthGate } from "../lib/use-auth-gate";
import { BottomNav } from "../components/bottomnav";

const MOODS = [
  { score: 1, label: "Berat", bg: "bg-[#ffd9d6]" },
  { score: 2, label: "Lelah", bg: "bg-[#ffebc8]" },
  { score: 3, label: "Biasa", bg: "bg-[#eef2f0]" },
  { score: 4, label: "Baik", bg: "bg-[#dcf1e6]" },
  { score: 5, label: "Ceria", bg: "bg-[#c6ead8]" },
];

const ENERGI = [
  { nilai: 1, label: "Rendah", lebar: "w-[30%]" },
  { nilai: 2, label: "Sedang", lebar: "w-[60%]" },
  { nilai: 3, label: "Tinggi", lebar: "w-[90%]" },
];

type Status = "diam" | "menyimpan" | "tersimpan" | "gagal";

export default function Home() {
  const router = useRouter();
  const { profile, loading } = useAuthGate();
  const [mood, setMood] = useState(3);
  const [tidur, setTidur] = useState(7);
  const [energi, setEnergi] = useState(2);
  const [jurnal, setJurnal] = useState("");
  const [status, setStatus] = useState<Status>("diam");
  const [sudahAda, setSudahAda] = useState(false);

  const [hariIni, setHariIni] = useState<string>("");

  useEffect(() => {
    setHariIni(tanggalLokal(new Date()));
  }, []);

  // Akun konselor langsung diarahkan ke dashboard.
  useEffect(() => {
    if (profile?.role === "counselor") router.replace("/dashboard-konselor");
  }, [profile, router]);

  // Muat check-in hari ini kalau sudah pernah diisi.
  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data } = await supabase
        .from("checkins")
        .select("mood, tidur, energi, jurnal")
        .eq("tanggal", hariIni)
        .maybeSingle();
      if (data) {
        setMood(data.mood);
        setTidur(Number(data.tidur));
        setEnergi(data.energi);
        setJurnal(data.jurnal ?? "");
        setSudahAda(true);
      }
    })();
  }, [loading, hariIni]);

  async function simpan() {
    setStatus("menyimpan");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setStatus("gagal");
      return;
    }
    const { error } = await supabase.from("checkins").upsert(
      { user_id: auth.user.id, tanggal: hariIni, mood, tidur, energi, jurnal },
      { onConflict: "user_id,tanggal" }
    );
    if (error) {
      setStatus("gagal");
    } else {
      setStatus("tersimpan");
      setSudahAda(true);
    }
  }

  function ubahTidur(delta: number) {
    setTidur((t) => Math.min(12, Math.max(0, t + delta)));
    setStatus("diam");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat Beranda...</p>
      </main>
    );
  }

  const stepper =
    "flex h-8 w-8 items-center justify-center rounded-full border border-[#e1e8e5] bg-white text-lg font-semibold text-[#2f7f73] active:scale-95";

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-24 font-sans sm:border-x sm:border-[#e1e8e5]">
      <div className="px-6 pt-14">
        <header className="mb-4 space-y-1.5">
          <p className="text-sm text-[#5b6b66]">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-[26px] font-bold leading-tight text-[#1f2d2a]">
            Halo, {profile?.display_name || "Teman"}. Apa kabar hari ini?
          </h1>
        </header>

        <div className="space-y-4">
          <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
            <p className="text-xs font-bold text-[#2f7f73]">CHECK-IN HARIAN</p>
            <h2 className="text-lg font-bold text-[#1f2d2a]">Mood kamu sekarang</h2>

            <div className="flex gap-2" role="radiogroup" aria-label="Mood kamu sekarang">
              {MOODS.map((m) => {
                const aktif = mood === m.score;
                return (
                  <button
                    key={m.score}
                    type="button"
                    role="radio"
                    aria-checked={aktif}
                    onClick={() => {
                      setMood(m.score);
                      setStatus("diam");
                    }}
                    className={
                      `flex h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 transition-transform active:scale-95 ${m.bg} ` +
                      (aktif ? "border-[#2f7f73]" : "border-transparent")
                    }
                  >
                    <span className="text-xl font-bold text-[#1f2d2a]">{m.score}</span>
                    <span className="text-xs font-semibold text-[#1f2d2a]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tidur */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5b6b66]">Tidur semalam</span>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Kurangi jam tidur" onClick={() => ubahTidur(-0.5)} className={stepper}>
                    −
                  </button>
                  <span className="min-w-[56px] text-center font-bold text-[#1f2d2a]">
                    {String(tidur).replace(".", ",")} jam
                  </span>
                  <button type="button" aria-label="Tambah jam tidur" onClick={() => ubahTidur(0.5)} className={stepper}>
                    +
                  </button>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e8e5]">
                <div
                  className="h-full rounded-full bg-[#2f7f73] transition-all"
                  style={{ width: `${Math.min(100, (tidur / 9) * 100)}%` }}
                />
              </div>
            </div>

            {/* Energi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5b6b66]">Tingkat energi</span>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Tingkat energi">
                  {ENERGI.map((e) => (
                    <button
                      key={e.nilai}
                      type="button"
                      role="radio"
                      aria-checked={energi === e.nilai}
                      onClick={() => {
                        setEnergi(e.nilai);
                        setStatus("diam");
                      }}
                      className={
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors " +
                        (energi === e.nilai ? "bg-[#2f7f73] text-white" : "bg-[#eef2f0] text-[#5b6b66]")
                      }
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e8e5]">
                <div
                  className={`h-full rounded-full bg-[#2f7f73] transition-all ${ENERGI.find((e) => e.nilai === energi)?.lebar}`}
                />
              </div>
            </div>

            <textarea
              value={jurnal}
              onChange={(e) => {
                setJurnal(e.target.value);
                setStatus("diam");
              }}
              placeholder="Tulis jurnal singkat... (opsional)"
              aria-label="Jurnal singkat"
              className="h-14 w-full resize-none rounded-xl bg-[#f6f8f7] px-3 py-3 text-sm text-[#1f2d2a] outline-none placeholder:text-[#8a9893] focus:ring-2 focus:ring-[#2f7f73]/30"
            />

            {status === "gagal" && (
              <p role="alert" className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]">
                Check-in belum tersimpan. Coba lagi.
              </p>
            )}
            {status === "tersimpan" && (
              <p role="status" className="rounded-xl border border-[#9cd3c6] bg-[#d8eeea] px-3 py-2 text-sm text-[#1f5f55]">
                Check-in hari ini tersimpan. Lihat polanya di tab Insight.
              </p>
            )}

            <button
              type="button"
              onClick={simpan}
              disabled={status === "menyimpan"}
              className="w-full rounded-2xl bg-[#2f7f73] py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-[#276b61] disabled:opacity-60"
            >
              {status === "menyimpan" ? "Menyimpan..." : sudahAda ? "Perbarui Check-in" : "Simpan Check-in"}
            </button>
          </section>

          <section className="space-y-[10px] rounded-[20px] border border-[#ffe2a8] bg-[#fff6e5] p-[18px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#1f2d2a]">Pola stres meningkat</h2>
              <span className="rounded-full bg-[#ffebc8] px-3 py-1 text-xs font-semibold text-[#9a5b00]">Sedang</span>
            </div>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              Tidur kurang dari 6 jam selama 4 hari dan mood turun 3 hari berturut-turut.
            </p>
            <a
              href="/triage"
              className="block w-full rounded-2xl border-[1.5px] border-[#9a5b00] bg-white py-[15px] text-center text-[15px] font-semibold text-[#9a5b00] transition-colors hover:bg-[#fff6e5]"
            >
              Lakukan skrining singkat
            </a>
          </section>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}