"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  role: "student" | "counselor";
  consent_at: string | null;
};

// Pakai di setiap halaman yang butuh login + persetujuan data.
// Belum login -> /login, belum setuju -> /consent.
export function useAuthGate() {
  const router = useRouter();
  const [state, setState] = useState<{
    loading: boolean;
    user: User | null;
    profile: Profile | null;
  }>({ loading: true, user: null, profile: null });

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, role, consent_at")
        .eq("id", session.user.id)
        .single();

      if (!active) return;

      const profile = data as Profile | null;
      if (!profile?.consent_at) {
        router.replace("/consent");
        return;
      }

      setState({ loading: false, user: session.user, profile });
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return state;
}
