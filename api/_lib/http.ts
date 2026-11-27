import { createClient } from "@supabase/supabase-js";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export async function readJson<T>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; } catch { return null; }
}

/**
 * When Supabase is configured, /api calls that cost money (OpenAI, Google) require a signed-in user.
 * Without Supabase (local demo mode) they are open, so only run that mode on your own machine.
 */
export async function requireUser(req: Request): Promise<{ ok: true; userId: string | null } | { ok: false; res: Response }> {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: true, userId: null };
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, res: json({ error: "Sign in to use this feature." }, 401) };
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { ok: false, res: json({ error: "Your session has expired. Sign in again." }, 401) };
  return { ok: true, userId: data.user.id };
}
