import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { moderasi } from "@/lib/moderasi";

const TOPIK = ["Umum", "Stres akademik", "Kesepian", "Tidur", "Keluarga"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  // Samakan nama env ini dengan yang dipakai di lib/supabase.ts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );

  const { data: auth, error: eAuth } = await supabase.auth.getUser(token);
  if (eAuth || !auth.user) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  let body: { jenis?: unknown; isi?: unknown; topik?: unknown; postId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const jenis = body.jenis === "komentar" ? "komentar" : body.jenis === "post" ? "post" : null;
  const isi = typeof body.isi === "string" ? body.isi.trim() : "";
  const maks = jenis === "komentar" ? 300 : 500;
  if (!jenis || isi.length < 1 || isi.length > maks) {
    return NextResponse.json({ error: "Isi tidak valid" }, { status: 400 });
  }

  const m = moderasi(isi);
  if (m.status !== "ok") return NextResponse.json(m); // bukan error: dijelaskan ke pengguna di UI

  if (jenis === "post") {
    const topik = typeof body.topik === "string" && TOPIK.includes(body.topik) ? body.topik : "Umum";
    const { error } = await supabase
      .from("community_posts")
      .insert({ user_id: auth.user.id, topik, isi });
    if (error) {
      console.error("Gagal posting:", error);
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }
  } else {
    const postId = typeof body.postId === "string" && UUID.test(body.postId) ? body.postId : null;
    if (!postId) return NextResponse.json({ error: "Post tidak valid" }, { status: 400 });
    const { error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: auth.user.id, isi });
    if (error) {
      console.error("Gagal komentar:", error);
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: "ok" });
}