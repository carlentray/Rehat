import { NextResponse } from "next/server";
import { analisis, type Checkin } from "../../../lib/insight";
import { createClient } from "@supabase/supabase-js";

async function cekAkses(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { ok: false as const };
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return { ok: false as const };
  const { data: c } = await sb
    .from("consents").select("ai_triage").eq("user_id", user.id).maybeSingle();
  return { ok: true as const, aiBoleh: c?.ai_triage === true };
}

const SYSTEM_PROMPT = `Kamu adalah Rehat, pendamping kesehatan mental untuk mahasiswa Indonesia.
Tugasmu menjelaskan pola dari data check-in harian seseorang selama maksimal 7 hari.
Aturan ketat:
1. Jangan mendiagnosis dan jangan menyebut nama gangguan atau penyakit.
2. Jangan mengubah skor atau tingkat stres yang diberikan.
3. Hanya sebut hubungan antar data (misalnya tidur dan mood) jika benar-benar terlihat di data. Jangan mengarang sebab.
4. Bahasa Indonesia santai, hangat, 2 sampai 3 kalimat, ditutup satu saran kecil yang praktis.
5. Jangan menyarankan obat atau dosis.
6. Keluaran HANYA JSON: {"pola": string}.`;

function valid(d: unknown): d is Checkin {
  const c = d as Checkin;
  return (
    !!c &&
    typeof c.tanggal === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(c.tanggal) &&
    Number.isInteger(c.mood) && c.mood >= 1 && c.mood <= 5 &&
    typeof c.tidur === "number" && c.tidur >= 0 && c.tidur <= 24 &&
    Number.isInteger(c.energi) && c.energi >= 1 && c.energi <= 3
  );
}

export async function POST(req: Request) {
  const akses = await cekAkses(req);
  if (!akses.ok) return NextResponse.json({ error: "Perlu login" }, { status: 401 });
  
  let body: { data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const data = body.data;
  if (!Array.isArray(data) || data.length > 7 || !data.every(valid)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  // Skor dihitung ulang di server; nilai dari client tidak dipercaya.
  const hasil = analisis(data);
  if (!hasil) return NextResponse.json({ pola: null });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ pola: null });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify({
                    skor_stres: `${hasil.skor} dari 100`,
                    tingkat: hasil.level,
                    alasan_sistem: hasil.alasan,
                    check_in_harian: data.map((x: Checkin) => ({
                      tanggal: x.tanggal,
                      mood_1_sampai_5: x.mood,
                      tidur_jam: x.tidur,
                      energi_1_rendah_3_tinggi: x.energi,
                    })),
                  }),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 1500,
          },
        }),
      }
    );
    if (!res.ok) {
      console.error("Gemini error:", res.status, await res.text());
      return NextResponse.json({ pola: null });
    }
    const json = await res.json();
    const teks: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!teks) return NextResponse.json({ pola: null });
    const j = JSON.parse(teks.replace(/```json|```/g, "").trim());
    const pola = typeof j.pola === "string" ? j.pola.slice(0, 600) : null;
    return NextResponse.json({ pola });
  } catch (e) {
    console.error("Insight AI gagal:", e);
    return NextResponse.json({ pola: null });
  }
}