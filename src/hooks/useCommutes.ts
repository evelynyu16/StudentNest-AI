// Real travel times from Google (via /api/commute), with a distance-based estimate as fallback.
import { useEffect, useMemo, useState } from "react";
import { commuteApi } from "../lib/api";
import { estimateMinutes, kmBetween } from "../lib/geo";
import type { Listing, Mode } from "../lib/types";

export interface Commute { min: number; real: boolean }

const cache = new Map<string, number | null>();   // key -> minutes (null = no route found)
let unavailable = false;                           // server has no Google key: stop asking
const keyOf = (l: Listing, mode: Mode) => `${l.lat?.toFixed(5)},${l.lng?.toFixed(5)}>${l.anchor.lat.toFixed(5)},${l.anchor.lng.toFixed(5)}|${mode}`;

export function useCommutes(listings: Listing[], mode: Mode) {
  const [version, setVersion] = useState(0);
  const missing = useMemo(() => listings.filter(l => l.lat != null && l.lng != null && !cache.has(keyOf(l, mode))), [listings, mode, version]);

  useEffect(() => {
    if (unavailable || !missing.length) return;
    let cancelled = false;
    // One request per destination (anchor), up to 25 origins each.
    const groups = new Map<string, Listing[]>();
    for (const l of missing) { const k = `${l.anchor.lat},${l.anchor.lng}`; groups.set(k, [...(groups.get(k) || []), l]); }
    Promise.all([...groups.values()].map(async ls => {
      for (let i = 0; i < ls.length; i += 25) {
        const chunk = ls.slice(i, i + 25);
        const { minutes } = await commuteApi(chunk.map(l => ({ id: l.id, lat: l.lat!, lng: l.lng! })), chunk[0].anchor, mode);
        for (const l of chunk) cache.set(keyOf(l, mode), minutes[l.id] ?? null);
      }
    })).then(() => { if (!cancelled) setVersion(v => v + 1); })
      .catch(e => { if (e?.status === 503 || e?.status === 401) unavailable = true; if (!cancelled) setVersion(v => v + 1); });
    return () => { cancelled = true; };
  }, [missing, mode]);

  return useMemo(() => (l: Listing): Commute | null => {
    if (l.lat == null || l.lng == null) return null;
    const real = cache.get(keyOf(l, mode));
    if (typeof real === "number") return { min: real, real: true };
    return { min: estimateMinutes(kmBetween(l.anchor, { lat: l.lat, lng: l.lng }), mode), real: false };
  }, [mode, version]);
}
