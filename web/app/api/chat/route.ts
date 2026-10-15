import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cekAmbigu, cekKataKrisis } from "@/lib/triage";
import {
  CHAT_SYSTEM_PROMPT,
  FALLBACK_CHAT,
  RESPON_KRISIS_CHAT,
  RESPON_DIAGNOSIS,
  RESPON_LUAR_TOPIK,
  amanKeluar,
  bersihkan,
  cekMintaDiagnosis,
  cekLuarTopik,
  RESPON_AMBIGU,
} from "@/lib/chat-safety";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";

const MAKS_PESAN = 6; // jumlah giliran terakhir yang dikirim ke model
const MAKS_PANJANG = 500;

// Rate limit sederhana per user (in-memory; cukup untuk demo/1 instance).
const jejak = new Map<string, number[]>();
function kebanyakan(uid: string) {
  const sekarang = Date.now();
  const w = (jejak.get(uid) ?? []).filter((t) => sekarang - t < 60_000);
  w.push(sekarang);
  jejak.set(uid, w);
  return w.length > 10; // maks 10 pesan per menit
}

async function cekAkses(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  );
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return null;
  const { data: c } = await sb
    .from("consents").select("ai_triage").eq("user_id", user.id).maybeSingle();
  return { uid: user.id, aiBoleh: c?.ai_triage === true };
}

type Pesan = { role: "user" | "assistant"; content: string };

function valid(m: unknown): m is Pesan {
  const p = m as Pesan;
  return (
    !!p &&
    (p.role === "user" || p.role === "assistant") &&
    typeof p.content === "string" &&
    p.content.trim().length > 0 &&
    p.content.length <= MAKS_PANJANG
  );
}

export async function POST(req: Request) {
  const akses = await cekAkses(req);
  if (!akses) return NextResponse.json({ error: "Perlu login" }, { status: 401 });
  if (!akses.aiBoleh) return NextResponse.json({ error: "consent" }, { status: 403 });
  if (kebanyakan(akses.uid)) {
    return NextResponse.json({ error: "Terlalu cepat. Tunggu sebentar ya." }, { status: 429 });
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const m = body.messages;
  if (!Array.isArray(m) || m.length === 0 || m.length > 50 || !m.every(valid) || m[m.length - 1].role !== "user") {
    return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
  }
  const riwayat = (m as Pesan[]).slice(-MAKS_PESAN);

  // 1. Jalur krisis: cek SEMUA pesan user di riwayat, model tidak dipanggil.
  if (riwayat.some((x) => x.role === "user" && cekKataKrisis(x.content))) {
    return NextResponse.json({ krisis: true, balasan: RESPON_KRISIS_CHAT });
  }

  // Jalur 2 dan 3 hanya memeriksa pesan user TERAKHIR, supaya percakapan tidak "terkunci" selamanya.
  const terakhir = riwayat[riwayat.length - 1].content;

  // 2. Pengguna menyebut/menanyakan label diagnosis: balasan tetap, model tidak dipanggil.
  if (cekMintaDiagnosis(terakhir)) {
    return NextResponse.json({ krisis: false, balasan: RESPON_DIAGNOSIS, dijaga: true });
  }

  // 3. Di luar topik curhat (kode, esai, dll.): tolak ramah, model tidak dipanggil.
  if (cekLuarTopik(terakhir)) {
    return NextResponse.json({ krisis: false, balasan: RESPON_LUAR_TOPIK, dijaga: true });
  }

  if (cekAmbigu(riwayat[riwayat.length - 1].content)) {
  return NextResponse.json({ krisis: false, balasan: RESPON_AMBIGU, dijaga: true });
}

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000), // cold start model lokal bisa lambat
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        keep_alive: "30m",
        options: {
          temperature: 0.3,
          top_p: 0.9,
          repeat_penalty: 1.05,
          num_predict: 120,
          num_ctx: 2048,
        },
        messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...riwayat],
      }),
    });
    if (!res.ok) {
      console.error("Ollama error:", res.status, (await res.text()).slice(0, 300));
      return NextResponse.json({ error: "Rehat sedang tidak bisa dihubungi." }, { status: 503 });
    }
    const json = await res.json();
    const teks = bersihkan(String(json?.message?.content ?? ""));

    // Output guard: jawaban bermasalah diganti teks aman.
    if (!teks || !amanKeluar(teks) || cekKataKrisis(teks)) {
      return NextResponse.json({ krisis: false, balasan: FALLBACK_CHAT, dijaga: true });
    }
    return NextResponse.json({ krisis: false, balasan: teks });
  } catch (e) {
    console.error("Chat gagal:", e);
    return NextResponse.json({ error: "Rehat sedang tidak bisa dihubungi." }, { status: 503 });
  }
}