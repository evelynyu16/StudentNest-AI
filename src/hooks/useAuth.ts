import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready, enabled: !!supabase };
}

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error("Sign-in isn't configured.");
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) throw error;
}
export async function signInWithGoogle() {
  if (!supabase) throw new Error("Sign-in isn't configured.");
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
  if (error) throw error;
}
export async function signOut() { await supabase?.auth.signOut(); }
