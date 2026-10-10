"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/bottomnav";

const GROUNDING = [
  "5 hal yang bisa kamu lihat",
  "4 hal yang bisa kamu sentuh",
  "3 hal yang bisa kamu dengar",
  "2 hal yang bisa kamu cium",
  "1 hal yang bisa kamu rasakan di mulut, lalu tarik napas dalam",
];

// Sengaja TIDAK memakai useAuthGate: bantuan darurat harus selalu bisa dibuka.
export default function BantuanPage() {
  const router = useRouter();
  const [latihan, setLatihan] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="space-y-1.5 px-6 pt-14">
        <h1 className="text-[26px] font-bold text-[#1f2d2a]">Bantuan Darurat</h1>
        <p className="text-sm text-[#5b6b66]">Kamu tidak sendirian. Bantuan tersedia sekarang.</p>
      </header>

      <div className="space-y-4 px-6 pt-4">
        {/* Darurat */}
        <section className="space-y-[10px] rounded-[20px] border border-[#f0a8a2] bg-[#ffd9d6] p-[18px]">
          <p className="text-xs font-bold text-[#b3261e]">JIKA KAMU DALAM BAHAYA</p>
          <h2 className="text-xl font-bold text-[#1f2d2a]">Hubungi SEJIWA</h2>
          <p className="text-sm leading-relaxed text-[#5b6b66]">
            Layanan kesehatan jiwa Kemenkes. Telepon 119 lalu tekan 8.
          </p>
          <a
            href="tel:119"
            className="block w-full rounded-2xl bg-[#b3261e] py-[15px] text-center text-[15px] font-semibold text-white transition-colors hover:bg-[#9e211b]"
          >
            Telepon 119 ext. 8
          </a>
        </section>

        {/* Konselor */}
        <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
          <h2 className="text-lg font-bold text-[#1f2d2a]">Konselor kampus</h2>
          <p className="text-sm leading-relaxed text-[#5b6b66]">
            Bicara langsung dengan konselor yang tersedia.
          </p>
          <Link
            href="/konselor"
            className="block w-full rounded-2xl border-[1.5px] border-[#2f7f73] bg-white py-[13px] text-center text-[15px] font-semibold text-[#2f7f73] transition-colors hover:bg-[#d8eeea]"
          >
            Lihat Konselor
          </Link>
        </section>

        {/* Grounding */}
        <section className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
          <h2 className="text-lg font-bold text-[#1f2d2a]">Tenangkan diri dulu</h2>
          <p className="text-sm leading-relaxed text-[#5b6b66]">Grounding 5-4-3-2-1 · 5 menit</p>
          {latihan && (
            <ol className="space-y-2 rounded-xl bg-[#f6f8f7] p-3 text-sm leading-relaxed text-[#1f2d2a]">
              {GROUNDING.map((g, i) => (
                <li key={g} className="flex gap-2">
                  <span className="font-bold text-[#2f7f73]">{i + 1}.</span>
                  <span>{g}</span>
                </li>
              ))}
            </ol>
          )}
          <button
            type="button"
            aria-expanded={latihan}
            onClick={() => setLatihan((v) => !v)}
            className="w-full rounded-2xl border-[1.5px] border-[#2f7f73] bg-white py-[13px] text-[15px] font-semibold text-[#2f7f73] transition-colors hover:bg-[#d8eeea]"
          >
            {latihan ? "Tutup Latihan" : "Mulai Latihan"}
          </button>
        </section>

        <p className="text-center text-xs text-[#8a9893]">Rehat bukan layanan darurat medis.</p>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2 text-center text-sm font-semibold text-[#5b6b66] underline"
        >
          Keluar Akun
        </button>
      </div>

      <BottomNav />
    </main>
  );
}