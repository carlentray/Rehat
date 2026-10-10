"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { OPSI, PERTANYAAN, type Level } from "@/lib/triage";
import { useAuthGate } from "../../lib/use-auth-gate";
import { BottomNav } from "../../components/bottomnav";

type Tahap = "tanya" | "catatan" | "proses" | "hasil";
type Hasil = {
  skor: number;
  level: Level;
  krisis: boolean;
  ringkasan: string;
  saran: string[];
};

const GAYA_LEVEL: Record<Level, { label: string; chip: string; bar: string; persen: (s: number) => number }> = {
  rendah: { label: "Rendah", chip: "bg-[#dcf1e6] text-[#1f5f55]", bar: "bg-[#2f7f73]", persen: (s) => (s / 27) * 100 },
  sedang: { label: "Sedang", chip: "bg-[#ffebc8] text-[#9a5b00]", bar: "bg-[#f2c27b]", persen: (s) => (s / 27) * 100 },
  tinggi: { label: "Tinggi", chip: "bg-[#ffd9d6] text-[#b3261e]", bar: "bg-[#b3261e]", persen: (s) => (s / 27) * 100 },
};

function BubbleAI({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#e1e8e5] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#1f2d2a]">
      {children}
    </div>
  );
}

function BubbleUser({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#2f7f73] px-4 py-3 text-[15px] font-semibold text-white">
      {children}
    </div>
  );
}

export default function TriagePage() {
  const { profile, loading } = useAuthGate();
  const [jawaban, setJawaban] = useState<number[]>([]);
  const [catatan, setCatatan] = useState("");
  const [tahap, setTahap] = useState<Tahap>("tanya");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ujung = useRef<HTMLDivElement>(null);

  const nama = profile?.display_name || "Teman";
  const nomor = Math.min(jawaban.length + 1, PERTANYAAN.length);

  useEffect(() => {
    ujung.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [jawaban.length, tahap]);

  function pilih(nilai: number) {
    const baru = [...jawaban, nilai];
    setJawaban(baru);
    if (baru.length === PERTANYAAN.length) setTahap("catatan");
  }

  async function kirim(sertakanCatatan: boolean) {
    setTahap("proses");
    setError(null);
    try {
      const { data: sesi } = await supabase.auth.getSession();
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sesi.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            answers: jawaban,
            catatan: sertakanCatatan ? catatan : "",
            nama,
          }),
        });
        if (res.status === 401) {
          setError("Sesimu berakhir. Masuk ulang lalu coba lagi.");
          setTahap("catatan");
          return;
        }
        if (!res.ok) throw new Error();
      const h: Hasil = await res.json();
      setHasil(h);
      setTahap("hasil");
      simpan(h);
    } catch {
      setError("Hasil belum bisa dihitung. Periksa koneksimu lalu coba lagi.");
      setTahap("catatan");
    }
  }

  // Catatan teks bebas sengaja TIDAK disimpan, hanya skor dan level.
  async function simpan(h: Hasil) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("triage_results").insert({
      user_id: data.user.id,
      skor: h.skor,
      level: h.level,
      krisis: h.krisis,
      jawaban,
      ringkasan: h.ringkasan,
    });
  }

  function ulangi() {
    setJawaban([]);
    setCatatan("");
    setHasil(null);
    setError(null);
    setTahap("tanya");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat...</p>
      </main>
    );
  }

  /* ---------- Tampilan hasil ---------- */
  if (tahap === "hasil" && hasil) {
    const g = GAYA_LEVEL[hasil.level];
    return (
      <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
        <div className="space-y-4 px-6 pt-14">
          <header className="space-y-1.5">
            <h1 className="text-[26px] font-bold text-[#1f2d2a]">Hasil Skrining</h1>
            <p className="text-sm text-[#5b6b66]">Skrining awal · bukan diagnosis</p>
          </header>

          {hasil.krisis ? (
            <section className="space-y-[10px] rounded-[20px] border border-[#f0a8a2] bg-[#ffd9d6] p-[18px]">
              <p className="text-xs font-bold text-[#b3261e]">KAMU PERLU BANTUAN SEKARANG</p>
              <h2 className="text-xl font-bold text-[#1f2d2a]">Hubungi SEJIWA</h2>
              <p className="text-sm leading-relaxed text-[#5b6b66]">{hasil.ringkasan}</p>
              <a
                href="tel:119"
                className="block w-full rounded-2xl bg-[#b3261e] py-[15px] text-center text-[15px] font-semibold text-white"
              >
                Telepon 119 lalu tekan 8
              </a>
              <Link
                href="/bantuan"
                className="block w-full rounded-2xl border-[1.5px] border-[#b3261e] bg-white py-[15px] text-center text-[15px] font-semibold text-[#b3261e]"
              >
                Buka halaman Bantuan
              </Link>
            </section>
          ) : (
            <>
              <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                <p className="text-xs font-bold text-[#2f7f73]">TINGKAT RISIKO</p>
                <div className="flex items-center gap-3">
                  <span className="text-[32px] font-bold leading-none text-[#1f2d2a]">{g.label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${g.chip}`}>
                    Skor {hasil.skor}/27
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e8e5]">
                  <div className={`h-full rounded-full ${g.bar}`} style={{ width: `${g.persen(hasil.skor)}%` }} />
                </div>
                <p className="text-sm leading-relaxed text-[#5b6b66]">{hasil.ringkasan}</p>
              </section>

              <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
                <h2 className="text-lg font-bold text-[#1f2d2a]">Langkah selanjutnya</h2>
                <ul className="space-y-2 text-sm leading-relaxed text-[#5b6b66]">
                  {hasil.saran.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
                <Link
                  href="/konselor"
                  className="block w-full rounded-2xl bg-[#2f7f73] py-[15px] text-center text-[15px] font-semibold text-white"
                >
                  Lihat Konselor
                </Link>
              </section>
            </>
          )}

          <button
            type="button"
            onClick={ulangi}
            className="w-full rounded-2xl border-[1.5px] border-[#2f7f73] bg-white py-[13px] text-[15px] font-semibold text-[#2f7f73]"
          >
            Ulangi skrining
          </button>
          <p className="text-center text-xs text-[#8a9893]">
            Hasil ini bukan diagnosis. Keputusan akhir ada di konselor atau psikolog.
          </p>
        </div>
        <BottomNav />
      </main>
    );
  }

  /* ---------- Tampilan chat ---------- */
  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="sticky top-0 z-10 space-y-3 border-b border-[#e1e8e5] bg-[#f6f8f7]/95 px-6 pb-3 pt-12 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-bold text-[#1f2d2a]">Rehat AI</h1>
            <p className="text-[13px] text-[#5b6b66]">Skrining awal · bukan diagnosis</p>
          </div>
          <Link
            href="/bantuan"
            className="shrink-0 rounded-full border-[1.5px] border-[#b3261e] bg-white px-3 py-1.5 text-xs font-semibold text-[#b3261e]"
          >
            Bantuan Darurat
          </Link>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#2f7f73]">
            {tahap === "tanya" ? `Pertanyaan ${nomor}/${PERTANYAAN.length}` : "Hampir selesai"}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e1e8e5]">
            <div
              className="h-full rounded-full bg-[#2f7f73] transition-all"
              style={{ width: `${(jawaban.length / PERTANYAAN.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="space-y-3 px-6 pt-4">
        <BubbleAI>
          Hai {nama}. Aku bantu cek kondisimu dengan beberapa pertanyaan singkat ya. Tidak ada jawaban
          benar atau salah.
        </BubbleAI>

        {jawaban.map((j, k) => (
          <div key={k} className="space-y-3">
            <BubbleAI>{PERTANYAAN[k]}</BubbleAI>
            <BubbleUser>{OPSI[j]}</BubbleUser>
          </div>
        ))}

        {tahap === "tanya" && (
          <div className="space-y-3">
            <BubbleAI>{PERTANYAAN[jawaban.length]}</BubbleAI>
            <div className="grid gap-2">
              {OPSI.map((o, nilai) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => pilih(nilai)}
                  className="w-full rounded-2xl border-[1.5px] border-[#2f7f73] bg-white px-4 py-3 text-left text-[15px] font-semibold text-[#2f7f73] transition-colors hover:bg-[#d8eeea] active:scale-[0.99]"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {(tahap === "catatan" || tahap === "proses") && (
          <div className="space-y-3">
            <BubbleAI>
              Terima kasih sudah jujur. Terakhir, adakah yang ingin kamu ceritakan? Boleh dilewati.
            </BubbleAI>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              disabled={tahap === "proses"}
              maxLength={500}
              rows={3}
              aria-label="Cerita tambahan (opsional)"
              placeholder="Tulis di sini kalau kamu mau..."
              className="w-full resize-none rounded-2xl border border-[#e1e8e5] bg-white p-3 text-[15px] text-[#1f2d2a] outline-none placeholder:text-[#8a9893] focus:border-[#2f7f73] focus:ring-2 focus:ring-[#2f7f73]/25"
            />
            {error && (
              <p role="alert" className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={tahap === "proses"}
              onClick={() => kirim(true)}
              className="w-full rounded-2xl bg-[#2f7f73] py-[15px] text-[15px] font-semibold text-white hover:bg-[#276b61] disabled:opacity-60"
            >
              {tahap === "proses" ? "Menghitung hasil..." : "Lihat Hasil"}
            </button>
            <button
              type="button"
              disabled={tahap === "proses"}
              onClick={() => kirim(false)}
              className="w-full rounded-2xl border-[1.5px] border-[#2f7f73] bg-white py-[13px] text-[15px] font-semibold text-[#2f7f73] disabled:opacity-60"
            >
              Lewati
            </button>
          </div>
        )}

        <p className="pt-2 text-center text-xs text-[#8a9893]">
          Jika kamu dalam bahaya, tekan tombol Bantuan Darurat di pojok kanan atas.
        </p>
        <div ref={ujung} />
      </div>

      <BottomNav />
    </main>
  );
}