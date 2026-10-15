"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthGate } from "../../lib/use-auth-gate";
import { BottomNav } from "../../components/bottomnav";

type Pesan = { role: "user" | "assistant"; content: string };
type Galat = { pesan: string; consent?: boolean; bisaUlang?: boolean };

const MAKS = 500;
const SAPAAN = "Aku Rehat, teman ngobrolmu. Lagi kepikiran apa hari ini?";
const PEMBUKA = [
  "Lagi capek banget",
  "Banyak tugas numpuk",
  "Susah tidur",
  "Lagi nggak semangat",
  "Cuma pengen cerita",
];

function Avatar() {
  return (
    <div
      aria-hidden
      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d8eeea] text-xs font-bold text-[#2f7f73]"
    >
      R
    </div>
  );
}

function BubbleBot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[90%] gap-2">
      <Avatar />
      <div className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-[#e1e8e5] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#1f2d2a]">
        {children}
      </div>
    </div>
  );
}

function Mengetik({ lambat }: { lambat: boolean }) {
  return (
    <div className="flex max-w-[90%] gap-2">
      <Avatar />
      <div className="space-y-1 rounded-2xl rounded-bl-md border border-[#e1e8e5] bg-white px-4 py-3">
        <div className="flex gap-1" role="status" aria-label="Rehat sedang mengetik">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="h-2 w-2 animate-bounce rounded-full bg-[#9cd3c6]"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
        {lambat && (
          <p className="text-xs text-[#8a9893]">Sebentar ya, Rehat lagi menyusun jawaban...</p>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { profile, loading } = useAuthGate();
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [teks, setTeks] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [lambat, setLambat] = useState(false);
  const [galat, setGalat] = useState<Galat | null>(null);
  const [krisis, setKrisis] = useState(false);
  const ujung = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ujung.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan.length, mengirim, krisis, galat]);

  // Kembalikan fokus ke input setelah balasan (bukan saat pertama buka, supaya keyboard tidak muncul sendiri).
  useEffect(() => {
    if (!mengirim && pesan.length > 0 && !krisis) area.current?.focus();
  }, [mengirim, pesan.length, krisis]);

  async function minta(riwayat: Pesan[]) {
    setMengirim(true);
    setGalat(null);
    setLambat(false);
    const timer = setTimeout(() => setLambat(true), 8000);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: riwayat }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setGalat({
          pesan: "Fitur ini butuh persetujuan 'Analisis AI'. Aktifkan di halaman persetujuan.",
          consent: true,
        });
      } else if (!res.ok) {
        setGalat({ pesan: j.error ?? "Pesan belum terkirim.", bisaUlang: true });
      } else if (j.krisis) {
        setKrisis(true); // balasan krisis tidak ditampilkan sebagai chat biasa
      } else {
        setPesan([...riwayat, { role: "assistant", content: j.balasan }]);
      }
    } catch {
      setGalat({ pesan: "Pesan belum terkirim. Periksa koneksimu.", bisaUlang: true });
    } finally {
      clearTimeout(timer);
      setLambat(false);
      setMengirim(false);
    }
  }

  function kirim(langsung?: string) {
    const isi = (langsung ?? teks).trim();
    if (!isi || mengirim || krisis) return;
    const baru: Pesan[] = [...pesan, { role: "user", content: isi }];
    setPesan(baru);
    setTeks("");
    if (area.current) area.current.style.height = "auto";
    minta(baru);
  }

  function mulaiBaru() {
    setPesan([]);
    setTeks("");
    setGalat(null);
    setKrisis(false);
  }

  function ubah(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTeks(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 112) + "px";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat...</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-52 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="sticky top-0 z-10 space-y-2 border-b border-[#e1e8e5] bg-[#f6f8f7]/95 px-6 pb-3 pt-12 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-[22px] font-bold text-[#1f2d2a]">Ngobrol dengan Rehat</h1>
            <p className="text-[13px] text-[#5b6b66]">Teman bicara · bukan psikolog, bukan diagnosis</p>
          </div>
          <Link
            href="/bantuan"
            className="shrink-0 rounded-full border-[1.5px] border-[#b3261e] bg-white px-3 py-1.5 text-xs font-semibold text-[#b3261e]"
          >
            Bantuan Darurat
          </Link>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <Link href="/triage" className="text-[#2f7f73] underline">
            Mau skrining singkat? →
          </Link>
          {pesan.length > 0 && !krisis && (
            <button type="button" onClick={mulaiBaru} className="text-[#5b6b66] underline">
              Percakapan baru
            </button>
          )}
        </div>
      </header>

      <div className="space-y-3 px-6 pt-4" role="log" aria-live="polite" aria-label="Percakapan">
        <BubbleBot>
          Hai {profile?.display_name || "Teman"}. {SAPAAN}
        </BubbleBot>

        {pesan.length === 0 && !krisis && (
          <div className="flex flex-wrap gap-2 pl-9">
            {PEMBUKA.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => kirim(t)}
                disabled={mengirim}
                className="rounded-full border-[1.5px] border-[#2f7f73] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#2f7f73] transition-colors hover:bg-[#d8eeea] active:scale-[0.98] disabled:opacity-60"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {pesan.map((p, i) =>
          p.role === "user" ? (
            <div
              key={i}
              className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#2f7f73] px-4 py-3 text-[15px] text-white"
            >
              {p.content}
            </div>
          ) : (
            <BubbleBot key={i}>{p.content}</BubbleBot>
          )
        )}

        {mengirim && <Mengetik lambat={lambat} />}

        {krisis && (
          <section className="space-y-2 rounded-[20px] border border-[#f0a8a2] bg-[#ffd9d6] p-[18px]">
            <h2 className="text-lg font-bold text-[#1f2d2a]">Kami peduli padamu</h2>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              Yang kamu rasakan penting, dan kamu layak mendapat bantuan sekarang. Tolong bicara dengan
              seseorang yang bisa menemanimu.
            </p>
            <a
              href="tel:119"
              className="block rounded-2xl bg-[#b3261e] py-[13px] text-center text-[15px] font-semibold text-white"
            >
              Telepon 119 lalu tekan 8
            </a>
            <Link
              href="/bantuan"
              className="block rounded-2xl border-[1.5px] border-[#b3261e] bg-white py-[13px] text-center text-[15px] font-semibold text-[#b3261e]"
            >
              Buka halaman Bantuan
            </Link>
          </section>
        )}

        {galat && (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2.5 text-sm text-[#b3261e]"
          >
            <p>{galat.pesan}</p>
            {galat.bisaUlang && (
              <button
                type="button"
                onClick={() => minta(pesan)}
                disabled={mengirim}
                className="font-semibold underline disabled:opacity-60"
              >
                Coba lagi
              </button>
            )}
            {galat.consent && (
              <Link href="/consent" className="font-semibold underline">
                Atur persetujuan
              </Link>
            )}
          </div>
        )}
        <div ref={ujung} />
      </div>

      {!krisis && (
        <div className="fixed bottom-[68px] left-1/2 z-40 w-full max-w-md -translate-x-1/2 space-y-1 border-t border-[#e1e8e5] bg-[#f6f8f7] px-6 pb-2 pt-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={area}
              value={teks}
              onChange={ubah}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  kirim();
                }
              }}
              rows={1}
              maxLength={MAKS}
              disabled={mengirim}
              aria-label="Tulis pesan"
              placeholder="Ceritakan apa yang kamu rasakan..."
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-[#e1e8e5] bg-white px-3 py-[11px] text-[15px] leading-snug text-[#1f2d2a] outline-none placeholder:text-[#8a9893] focus:border-[#2f7f73] focus:ring-2 focus:ring-[#2f7f73]/25 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => kirim()}
              disabled={mengirim || !teks.trim()}
              className="h-11 rounded-xl bg-[#2f7f73] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#276b61] disabled:opacity-50"
            >
              Kirim
            </button>
          </div>
          <p className="text-center text-[11px] text-[#8a9893]">
            {teks.length > 400
              ? `${teks.length}/${MAKS} karakter`
              : "Percakapan tidak disimpan. Rehat bukan layanan darurat."}
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}