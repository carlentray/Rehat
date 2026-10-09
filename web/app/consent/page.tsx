"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Pilihan = {
  key: "checkin" | "ai_triage" | "share_anon";
  judul: string;
  deskripsi: string;
  wajib?: boolean;
};

const PILIHAN: Pilihan[] = [
  {
    key: "checkin",
    judul: "Simpan check-in harian",
    deskripsi: "Mood, tidur, energi, dan jurnal singkat untuk membaca pola stresmu.",
    wajib: true,
  },
  {
    key: "ai_triage",
    judul: "Analisis AI Triage",
    deskripsi: "Jawaban skrining diproses AI untuk menentukan tingkat risiko.",
  },
  {
    key: "share_anon",
    judul: "Bagikan data anonim ke konselor",
    deskripsi: "Hanya angka agregat tanpa identitas, untuk dashboard konselor.",
  },
];

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        "flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f73]/40 " +
        (checked ? "bg-[#2f7f73] justify-end" : "bg-[#d5dedb] justify-start") +
        (disabled ? " opacity-80" : "")
      }
    >
      <span className="h-5 w-5 rounded-full bg-white" />
    </button>
  );
}

export default function ConsentPage() {
  const router = useRouter();
  const [nilai, setNilai] = useState({
    checkin: true,
    ai_triage: true,
    share_anon: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetuju() {
    setLoading(true);
    setError(null);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.from("consents").upsert({
      user_id: data.user.id,
      ...nilai,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setError("Persetujuan belum tersimpan. Coba lagi.");
      setLoading(false);
    } else {
      router.replace("/"); // ganti ke halaman Beranda Check-in
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7] px-6 py-10 font-sans">
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-1.5 pb-2">
          <h1 className="text-[26px] font-bold leading-tight text-[#1f2d2a]">
            Persetujuan Data
          </h1>
          <p className="text-sm text-[#5b6b66]">
            Baca singkat, lalu pilih yang kamu setuju.
          </p>
        </div>

        <section className="divide-y divide-[#e1e8e5] rounded-[20px] border border-[#e1e8e5] bg-white px-[18px]">
          {PILIHAN.map((p) => (
            <div key={p.key} className="flex items-start gap-3 py-[18px]">
              <div className="flex-1 space-y-[3px]">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#1f2d2a]">
                    {p.judul}
                  </span>
                  {p.wajib && (
                    <span className="rounded-full bg-[#d8eeea] px-[9px] py-[3px] text-[11px] font-semibold text-[#2f7f73]">
                      Wajib
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-snug text-[#5b6b66]">
                  {p.deskripsi}
                </p>
              </div>
              <Switch
                label={p.judul}
                checked={nilai[p.key]}
                disabled={p.wajib}
                onChange={(v) => setNilai((n) => ({ ...n, [p.key]: v }))}
              />
            </div>
          ))}
        </section>

        <p className="rounded-[20px] border border-[#9cd3c6] bg-[#d8eeea] px-[14px] py-[14px] text-[13px] leading-snug text-[#1f5f55]">
          Kamu bisa menarik persetujuan dan menghapus datamu kapan saja di Profil.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]"
          >
            {error}
          </p>
        )}

        <Button
          type="button"
          disabled={loading}
          onClick={handleSetuju}
          className="h-12 w-full rounded-2xl bg-[#2f7f73] text-[15px] font-semibold text-white hover:bg-[#276b61]"
        >
          {loading ? "Menyimpan..." : "Setuju & Lanjut"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => router.replace("/")}
          className="h-12 w-full rounded-2xl border-[#2f7f73] bg-white text-[15px] font-semibold text-[#2f7f73] hover:bg-[#d8eeea] hover:text-[#2f7f73]"
        >
          Atur nanti
        </Button>

        <p className="text-center text-xs text-[#8a9893]">
          Sesuai UU PDP. Rehat bukan diagnosis.
        </p>
      </div>
    </main>
  );
}