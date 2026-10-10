"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthGate } from "../../lib/use-auth-gate";
import { BottomNav } from "@/components/bottomnav";

type Konselor = {
  id: string;
  name: string;
  specialty: string | null;
  whatsapp: string | null;
  schedule: string | null;
};

// Inisial dari nama, mengabaikan gelar (kata yang mengandung titik: "Dr.", "M.Psi.").
function inisial(nama: string) {
  const kata = nama.split(/\s+/).filter((k) => k && !k.includes("."));
  const sumber = kata.length ? kata : nama.split(/\s+/);
  return sumber
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

// "0812-3456-7890" / "+62 812..." / "812..." -> "62812..."
function nomorWa(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  return "62" + d;
}

// Pesan awal sengaja generik: tidak membawa nama atau data pengguna.
const PESAN_AWAL = "Halo, saya mahasiswa dan ingin berkonsultasi. Apakah ada jadwal yang tersedia?";

export default function KonselorPage() {
  const { loading } = useAuthGate();
  const [daftar, setDaftar] = useState<Konselor[] | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data, error } = await supabase
        .from("counselors")
        .select("id, name, specialty, whatsapp, schedule")
        .order("name");
      if (error) {
        console.error("Gagal memuat konselor:", error);
        setGagal(true);
        setDaftar([]);
      } else {
        setDaftar((data ?? []) as Konselor[]);
      }
    })();
  }, [loading]);

  if (loading || daftar === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat konselor...</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="space-y-1.5 px-6 pt-14">
        <h1 className="text-[26px] font-bold text-[#1f2d2a]">Konselor Kampus</h1>
        <p className="text-sm text-[#5b6b66]">Pilih yang paling nyaman. Obrolanmu tetap rahasia.</p>
      </header>

      <div className="space-y-4 px-6 pt-4">
        {gagal && (
          <p role="alert" className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]">
            Daftar konselor belum bisa dimuat. Coba lagi nanti.
          </p>
        )}

        {!gagal && daftar.length === 0 && (
          <section className="rounded-[20px] border border-[#e1e8e5] bg-white p-[18px] text-sm leading-relaxed text-[#5b6b66]">
            Belum ada konselor terdaftar. Kalau kamu butuh bantuan sekarang, buka tab Bantuan.
          </section>
        )}

        {daftar.map((k) => (
          <section
            key={k.id}
            className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]"
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8eeea] text-[15px] font-semibold text-[#2f7f73]"
              >
                {inisial(k.name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#1f2d2a]">{k.name}</h2>
                {k.specialty && <p className="text-[13px] text-[#5b6b66]">{k.specialty}</p>}
                {k.schedule && <p className="text-xs text-[#8a9893]">{k.schedule}</p>}
              </div>
            </div>

            {k.whatsapp ? (
              <a
                href={`https://wa.me/${nomorWa(k.whatsapp)}?text=${encodeURIComponent(PESAN_AWAL)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-[#2f7f73] py-[11px] text-center text-sm font-semibold text-white transition-colors hover:bg-[#276b61]"
              >
                Hubungi via WhatsApp
              </a>
            ) : (
              <p className="rounded-2xl bg-[#eef2f0] py-[11px] text-center text-sm font-semibold text-[#8a9893]">
                Kontak belum tersedia
              </p>
            )}
          </section>
        ))}

        <p className="text-center text-xs text-[#8a9893]">
          Rehat tidak membagikan datamu ke konselor tanpa persetujuanmu.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}