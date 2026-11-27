// Tracker + priorities. Signed out: kept in this browser. Signed in: kept in Supabase,
// and anything saved while signed out is moved into the account on first sign-in.
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { DEFAULT_PRIORITIES, type Listing, type Priorities, type Status, type Tracker } from "../lib/types";

const LS_TRACKER = "studentnest-tracker-v3";
const LS_PRIO = "studentnest-priorities";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

export function useTracker(user: User | null) {
  const [tracker, setTracker] = useState<Tracker>(() => read<Tracker>(LS_TRACKER, {}));
  const [prio, setPrio] = useState<Priorities>(() => read(LS_PRIO, DEFAULT_PRIORITIES));
  const [syncError, setSyncError] = useState("");
  const [loading, setLoading] = useState(false);
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const cloud = !!(supabase && user);

  // Local mode persistence
  useEffect(() => { if (!cloud) write(LS_TRACKER, tracker); }, [tracker, cloud]);
  useEffect(() => { if (!cloud) write(LS_PRIO, prio); }, [prio, cloud]);

  // On sign-in: upload local items, then load the account's data.
  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setSyncError("");
      const local = read<Tracker>(LS_TRACKER, {});
      const rows = Object.values(local).map(t => ({ user_id: user.id, listing_id: t.listing.id, status: t.status, note: t.note, listing: t.listing }));
      if (rows.length) {
        const { error } = await supabase.from("tracker_items").upsert(rows, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
        if (!error) write(LS_TRACKER, {});
      }
      const [items, profile] = await Promise.all([
        supabase.from("tracker_items").select("listing_id,status,note,listing").order("created_at"),
        supabase.from("profiles").select("priorities").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      if (items.error) setSyncError("Couldn't load your saved apartments. Check your connection and reload.");
      else setTracker(Object.fromEntries(items.data.map(r => [r.listing_id, { status: r.status as Status, note: r.note, listing: r.listing as Listing }])));
      if (profile.data?.priorities) setPrio({ ...DEFAULT_PRIORITIES, ...(profile.data.priorities as Priorities) });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // On sign-out: go back to this browser's (now empty) local tracker.
  const prevUser = useRef(user);
  useEffect(() => {
    if (prevUser.current && !user) { setTracker(read<Tracker>(LS_TRACKER, {})); setPrio(read(LS_PRIO, DEFAULT_PRIORITIES)); }
    prevUser.current = user;
  }, [user]);

  const report = (error: unknown) => { if (error) setSyncError("Couldn't save that change. Check your connection and try again."); };

  const save = useCallback(async (listing: Listing) => {
    setTracker(t => ({ ...t, [listing.id]: { status: "Interested", note: "", listing } }));
    if (supabase && user) {
      const { error } = await supabase.from("tracker_items").upsert({ user_id: user.id, listing_id: listing.id, status: "Interested", note: "", listing });
      report(error);
    }
  }, [user]);

  const remove = useCallback(async (id: string) => {
    setTracker(t => { const n = { ...t }; delete n[id]; return n; });
    if (supabase && user) report((await supabase.from("tracker_items").delete().eq("user_id", user.id).eq("listing_id", id)).error);
  }, [user]);

  const setStatus = useCallback(async (id: string, status: Status) => {
    setTracker(t => t[id] ? { ...t, [id]: { ...t[id], status } } : t);
    if (supabase && user) report((await supabase.from("tracker_items").update({ status, updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("listing_id", id)).error);
  }, [user]);

  const setNote = useCallback((id: string, note: string) => {
    setTracker(t => t[id] ? { ...t, [id]: { ...t[id], note } } : t);
    if (!supabase || !user) return;
    clearTimeout(noteTimers.current[id]);
    noteTimers.current[id] = setTimeout(async () => {
      report((await supabase!.from("tracker_items").update({ note, updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("listing_id", id)).error);
    }, 600);
  }, [user]);

  const prioRef = useRef(prio); prioRef.current = prio;
  const setPriority = useCallback(async (k: keyof Priorities, w: number) => {
    const next = { ...prioRef.current, [k]: w };
    prioRef.current = next; setPrio(next);
    if (supabase && user) report((await supabase.from("profiles").upsert({ user_id: user.id, priorities: next, updated_at: new Date().toISOString() })).error);
  }, [user]);

  return { tracker, prio, save, remove, setStatus, setNote, setPriority, syncError, loading, cloud };
}
