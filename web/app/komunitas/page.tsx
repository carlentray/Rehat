"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthGate } from "../../lib/use-auth-gate";
import { BottomNav } from "@/components/bottomnav";

type Post = {
  id: string;
  topik: string;
  isi: string;
  created_at: string;
  dukungan: number;
  komentar: number;
  didukung: boolean;
  milik_saya: boolean;
};
type Komentar = { id: string; post_id: string; isi: string; created_at: string; milik_saya: boolean };

const TOPIK = ["Umum", "Stres akademik", "Kesepian", "Tidur", "Keluarga", "Percintaan", "Lainnya"];

function waktu(iso: string) {
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.floor(jam / 24)} hari lalu`;
}

async function ambilToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function kirimKeServer(payload: object) {
  const token = await ambilToken();
  const res = await fetch("/api/komunitas", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as { status?: string; pesan?: string; error?: string };
}

export default function KomunitasPage() {
  const { loading } = useAuthGate();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [teks, setTeks] = useState("");
  const [topik, setTopik] = useState(TOPIK[0]);
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [krisis, setKrisis] = useState(false);
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [komentar, setKomentar] = useState<Record<string, Komentar[]>>({});
  const [teksKomentar, setTeksKomentar] = useState<Record<string, string>>({});
  const [pesanKomentar, setPesanKomentar] = useState<Record<string, string>>({});

  async function muat() {
    const { data, error } = await supabase
      .from("v_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error("Gagal memuat komunitas:", error);
    setPosts((data ?? []) as Post[]);
  }

  async function muatKomentar(postId: string) {
    const { data } = await supabase
      .from("v_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at");
    setKomentar((k) => ({ ...k, [postId]: (data ?? []) as Komentar[] }));
  }

  useEffect(() => {
    if (!loading) muat();
  }, [loading]);

  async function kirim() {
    if (!teks.trim()) return;
    setMengirim(true);
    setPesan(null);
    setKrisis(false);
    try {
      const r = await kirimKeServer({ jenis: "post", isi: teks, topik });
      if (r.status === "ok") {
        setTeks("");
        await muat();
      } else if (r.status === "krisis") {
        setKrisis(true);
      } else {
        setPesan(r.pesan ?? "Postingan belum bisa dikirim. Coba lagi.");
      }
    } catch {
      setPesan("Postingan belum bisa dikirim. Periksa koneksimu.");
    } finally {
      setMengirim(false);
    }
  }

  async function dukung(p: Post) {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const ubah = (didukung: boolean, delta: number) =>
      setPosts((ps) =>
        ps?.map((x) => (x.id === p.id ? { ...x, didukung, dukungan: x.dukungan + delta } : x)) ?? null
      );
    ubah(!p.didukung, p.didukung ? -1 : 1); // optimistis
    const { error } = p.didukung
      ? await supabase.from("community_supports").delete().eq("post_id", p.id).eq("user_id", uid)
      : await supabase.from("community_supports").insert({ post_id: p.id, user_id: uid });
    if (error) muat(); // sinkronkan ulang dari server kalau gagal
  }

  async function hapus(p: Post) {
    if (!window.confirm("Hapus postinganmu? Ini tidak bisa dibatalkan.")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", p.id);
    if (!error) setPosts((ps) => ps?.filter((x) => x.id !== p.id) ?? null);
  }

  function bukaTutup(id: string) {
    const baru = terbuka === id ? null : id;
    setTerbuka(baru);
    if (baru && !komentar[baru]) muatKomentar(baru);
  }

  async function kirimKomentar(postId: string) {
    const isi = (teksKomentar[postId] ?? "").trim();
    if (!isi) return;
    setPesanKomentar((m) => ({ ...m, [postId]: "" }));
    try {
      const r = await kirimKeServer({ jenis: "komentar", postId, isi });
      if (r.status === "ok") {
        setTeksKomentar((t) => ({ ...t, [postId]: "" }));
        await muatKomentar(postId);
        setPosts((ps) => ps?.map((x) => (x.id === postId ? { ...x, komentar: x.komentar + 1 } : x)) ?? null);
      } else if (r.status === "krisis") {
        setPesanKomentar((m) => ({
          ...m,
          [postId]: "Kami peduli padamu. Tolong buka tab Bantuan untuk bicara dengan seseorang sekarang.",
        }));
      } else {
        setPesanKomentar((m) => ({ ...m, [postId]: r.pesan ?? "Komentar belum bisa dikirim." }));
      }
    } catch {
      setPesanKomentar((m) => ({ ...m, [postId]: "Komentar belum bisa dikirim. Periksa koneksimu." }));
    }
  }

  if (loading || posts === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
        <p className="text-sm text-[#5b6b66]">Memuat komunitas...</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-[#f6f8f7] pb-28 font-sans sm:border-x sm:border-[#e1e8e5]">
      <header className="space-y-1.5 px-6 pt-14">
        <h1 className="text-[26px] font-bold text-[#1f2d2a]">Komunitas Anonim</h1>
        <p className="text-sm text-[#5b6b66]">Cerita tanpa nama. Dimoderasi otomatis.</p>
      </header>

      <div className="space-y-4 px-6 pt-4">
        {/* Tulis */}
        <section className="space-y-3 rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            maxLength={500}
            rows={3}
            aria-label="Tulis postingan anonim"
            placeholder="Bagikan apa yang kamu rasakan..."
            className="w-full resize-none rounded-xl bg-[#f6f8f7] p-3 text-sm text-[#1f2d2a] outline-none placeholder:text-[#8a9893] focus:ring-2 focus:ring-[#2f7f73]/30"
          />
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Topik">
            {TOPIK.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={topik === t}
                onClick={() => setTopik(t)}
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (topik === t ? "bg-[#2f7f73] text-white" : "bg-[#eef2f0] text-[#5b6b66]")
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#d8eeea] px-[9px] py-[3px] text-[11px] font-semibold text-[#2f7f73]">
              Posting Anonim
            </span>
            <button
              type="button"
              onClick={kirim}
              disabled={mengirim || !teks.trim()}
              className="rounded-xl bg-[#2f7f73] px-[18px] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {mengirim ? "Mengirim..." : "Kirim"}
            </button>
          </div>
          {pesan && (
            <p role="alert" className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]">
              {pesan}
            </p>
          )}
        </section>

        {krisis && (
          <section className="space-y-2 rounded-[20px] border border-[#f0a8a2] bg-[#ffd9d6] p-[18px]">
            <h2 className="text-lg font-bold text-[#1f2d2a]">Kami peduli padamu</h2>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              Ceritamu penting, tapi tidak kami tampilkan di komunitas dan tidak disimpan. Tolong bicara
              dengan seseorang yang bisa menemanimu sekarang.
            </p>
            <a href="tel:119" className="block rounded-2xl bg-[#b3261e] py-[13px] text-center text-[15px] font-semibold text-white">
              Telepon 119 lalu tekan 8
            </a>
            <Link href="/bantuan" className="block rounded-2xl border-[1.5px] border-[#b3261e] bg-white py-[13px] text-center text-[15px] font-semibold text-[#b3261e]">
              Buka halaman Bantuan
            </Link>
          </section>
        )}

        {posts.length === 0 && (
          <section className="rounded-[20px] border border-[#e1e8e5] bg-white p-[18px] text-sm text-[#5b6b66]">
            Belum ada cerita. Jadilah yang pertama berbagi.
          </section>
        )}

        {posts.map((p) => (
          <article key={p.id} className="space-y-[10px] rounded-[20px] border border-[#e1e8e5] bg-white p-[18px]">
            <div className="flex items-center gap-2.5">
              <div aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8eeea] text-[13px] font-semibold text-[#2f7f73]">
                ?
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1f2d2a]">Anonim{p.milik_saya ? " (kamu)" : ""}</p>
                <p className="text-xs text-[#8a9893]">
                  {waktu(p.created_at)} · {p.topik}
                </p>
              </div>
              {p.milik_saya && (
                <button type="button" onClick={() => hapus(p)} className="text-xs font-semibold text-[#b3261e] underline">
                  Hapus
                </button>
              )}
            </div>

            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#5b6b66]">{p.isi}</p>

            <div className="flex gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => dukung(p)}
                aria-pressed={p.didukung}
                className={p.didukung ? "text-[#2f7f73]" : "text-[#8a9893]"}
              >
                {p.didukung ? "Didukung" : "Dukung"} · {p.dukungan}
              </button>
              <button
                type="button"
                onClick={() => bukaTutup(p.id)}
                aria-expanded={terbuka === p.id}
                className="text-[#2f7f73]"
              >
                {p.komentar} komentar
              </button>
            </div>

            {terbuka === p.id && (
              <div className="space-y-2 border-t border-[#e1e8e5] pt-3">
                {(komentar[p.id] ?? []).map((k) => (
                  <div key={k.id} className="rounded-xl bg-[#f6f8f7] px-3 py-2">
                    <p className="text-xs text-[#8a9893]">
                      Anonim{k.milik_saya ? " (kamu)" : ""} · {waktu(k.created_at)}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm text-[#1f2d2a]">{k.isi}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={teksKomentar[p.id] ?? ""}
                    onChange={(e) => setTeksKomentar((t) => ({ ...t, [p.id]: e.target.value }))}
                    maxLength={300}
                    placeholder="Tulis dukungan..."
                    aria-label="Tulis komentar"
                    className="h-10 flex-1 rounded-xl bg-[#f6f8f7] px-3 text-sm outline-none placeholder:text-[#8a9893] focus:ring-2 focus:ring-[#2f7f73]/30"
                  />
                  <button
                    type="button"
                    onClick={() => kirimKomentar(p.id)}
                    className="rounded-xl bg-[#2f7f73] px-4 text-sm font-semibold text-white"
                  >
                    Kirim
                  </button>
                </div>
                {pesanKomentar[p.id] && (
                  <p role="alert" className="text-xs text-[#b3261e]">{pesanKomentar[p.id]}</p>
                )}
              </div>
            )}
          </article>
        ))}

        <section className="rounded-[20px] border border-[#ffe2a8] bg-[#fff6e5] p-[14px]">
          <p className="text-xs leading-relaxed text-[#5b6b66]">
            Postingan dicek otomatis. Konten berbahaya disaring dan diarahkan ke bantuan.
          </p>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}