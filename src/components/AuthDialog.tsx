import { useState } from "react";
import { signInWithEmail, signInWithGoogle } from "../hooks/useAuth";
import { Dialog } from "./Dialog";

// Google sign-in needs the Google provider turned on in Supabase (Authentication -> Sign In / Providers).
// Set VITE_ENABLE_GOOGLE_SIGNIN=true once it is.
const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === "true";

export function AuthDialog({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setState("sending");
    try { await signInWithEmail(email.trim()); setState("sent"); }
    catch (x) { setErr((x as Error).message || "Couldn't send the link. Try again."); setState("idle"); }
  };
  const google = async () => { setErr(""); try { await signInWithGoogle(); } catch (x) { setErr((x as Error).message); } };

  return (
    <Dialog open={open} onClose={() => { onClose(); setState("idle"); setErr(""); }} title="Sign in to StudentNest">
      {reason && <p className="muted">{reason}</p>}
      {state === "sent" ? (
        <div className="tip">Check <strong>{email}</strong> for a sign-in link. Open it on this device to finish signing in. You can close this window.</div>
      ) : (
        <>
          {GOOGLE_ENABLED && <>
            <button type="button" className="btn wide-btn" onClick={google}>Continue with Google</button>
            <div className="or"><span>or</span></div>
          </>}
          <form onSubmit={send} className="stack">
            <label className="field"><span>School or personal email</span>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" />
            </label>
            <button className="btn primary wide-btn" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
          </form>
        </>
      )}
      {err && <p className="addr-msg err" role="alert">{err}</p>}
      <p className="meta small">Signing in keeps your tracker, notes and pasted listings on every device. Anything you saved before signing in moves into your account.</p>
    </Dialog>
  );
}
