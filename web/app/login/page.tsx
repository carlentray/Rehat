"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Mode = "masuk" | "daftar";

// Terjemahan pesan error Supabase yang paling sering muncul.
function ramahkanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email atau kata sandi salah. Coba periksa lagi.";
  if (m.includes("already registered"))
    return "Email ini sudah terdaftar. Coba masuk.";
  if (m.includes("anonymous sign-ins are disabled"))
    return "Mode anonim belum diaktifkan. Hubungi pengembang.";
  if (m.includes("password"))
    return "Kata sandi minimal 6 karakter.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function resetPesan() {
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetPesan();

    if (mode === "daftar") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) setError(ramahkanError(error.message));
      else if (data.session) router.replace("/consent");
      else setInfo("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(ramahkanError(error.message));
      else router.replace("/consent");
    }

    setLoading(false);
  }

  async function handleAnonim() {
    setLoading(true);
    resetPesan();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(ramahkanError(error.message));
      setLoading(false);
    } else {
      router.replace("/consent");
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-[#e1e8e5] bg-[#f6f8f7] px-4 text-[15px] text-[#1f2d2a] " +
    "placeholder:text-[#8a9893] outline-none transition " +
    "focus:border-[#2f7f73] focus:bg-white focus:ring-2 focus:ring-[#2f7f73]/25";

  const tabClass = (aktif: boolean) =>
    "flex-1 rounded-xl py-2.5 text-sm font-semibold transition " +
    (aktif
      ? "bg-white text-[#2f7f73] shadow-sm"
      : "text-[#5b6b66] hover:text-[#1f2d2a]");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7] px-6 py-10 font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="space-y-3">
          <div
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f7f73] text-2xl font-bold text-white"
          >
            R
          </div>
          <div className="space-y-1">
            <h1 className="text-[28px] font-bold leading-tight text-[#1f2d2a]">
              {mode === "masuk" ? "Selamat datang kembali" : "Mulai bersama Rehat"}
            </h1>
            <p className="text-sm leading-relaxed text-[#5b6b66]">
              {mode === "masuk"
                ? "Masuk untuk lanjut check-in harian."
                : "Buat akun untuk mulai memantau kondisi harianmu."}
            </p>
          </div>
        </div>

        {/* Toggle masuk / daftar */}
        <div
          className="flex gap-1 rounded-2xl bg-[#e1e8e5] p-1"
          role="group"
          aria-label="Pilih masuk atau daftar"
        >
          <button
            type="button"
            aria-pressed={mode === "masuk"}
            className={tabClass(mode === "masuk")}
            onClick={() => {
              setMode("masuk");
              resetPesan();
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            aria-pressed={mode === "daftar"}
            className={tabClass(mode === "daftar")}
            onClick={() => {
              setMode("daftar");
              resetPesan();
            }}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[20px] border border-[#e1e8e5] bg-white p-5"
        >
          {mode === "daftar" && (
            <div className="space-y-1.5">
              <label htmlFor="nama" className="text-sm font-semibold text-[#1f2d2a]">
                Nama panggilan
              </label>
              <input
                id="nama"
                className={inputClass}
                placeholder="Contoh: Raka"
                autoComplete="nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-[#1f2d2a]">
              Email
            </label>
            <input
              id="email"
              className={inputClass}
              type="email"
              placeholder="nama@kampus.ac.id"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-[#1f2d2a]">
              Kata sandi
            </label>
            <input
              id="password"
              className={inputClass}
              type="password"
              placeholder="Minimal 6 karakter"
              autoComplete={mode === "masuk" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-[#f0a8a2] bg-[#ffd9d6] px-3 py-2 text-sm text-[#b3261e]"
            >
              {error}
            </p>
          )}
          {info && (
            <p
              role="status"
              className="rounded-xl border border-[#9cd3c6] bg-[#d8eeea] px-3 py-2 text-sm text-[#1f5f55]"
            >
              {info}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-[#2f7f73] text-[15px] font-semibold text-white hover:bg-[#276b61]"
          >
            {loading ? "Memproses..." : mode === "masuk" ? "Masuk" : "Buat Akun"}
          </Button>
        </form>

        {/* Anonim */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-[#8a9893]">
            <span className="h-px flex-1 bg-[#d5dedb]" />
            atau
            <span className="h-px flex-1 bg-[#d5dedb]" />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleAnonim}
            className="h-12 w-full rounded-2xl border-[#2f7f73] bg-white text-[15px] font-semibold text-[#2f7f73] hover:bg-[#d8eeea] hover:text-[#2f7f73]"
          >
            Masuk sebagai Anonim
          </Button>
        </div>

        <p className="text-center text-xs leading-relaxed text-[#8a9893]">
          Data diolah anonim dan hanya dipakai dengan persetujuanmu, sesuai UU PDP.
          Rehat adalah alat skrining awal, bukan diagnosis.
        </p>
      </div>
    </main>
  );
}