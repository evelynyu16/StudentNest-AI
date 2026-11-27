// Rule-based recommendation: weights the student's priorities against each saved listing's numbers.
import { clamp, fmt, movePerPerson, perPerson } from "./format";
import type { Listing, Priorities, TrackerItem } from "./types";

export const PRIO_LEVELS = ["Don’t care", "Somewhat", "Very"];

export interface Factor { k: keyof Priorities; label: string; best: string; get: (l: Listing) => number; show: (v: number) => string }

export function factors(commuteMin: (l: Listing) => number | null, modeText: string): Factor[] {
  return [
    { k: "cost", label: "All-in cost", best: "Lowest all-in cost", get: perPerson, show: v => fmt(v) + " per person" },
    { k: "commute", label: "Commute to campus", best: "Shortest commute", get: l => commuteMin(l) ?? Infinity,
      show: v => Number.isFinite(v) ? `${v} min ${modeText}` : "unknown (no address)" },
    { k: "cash", label: "Cash needed to move in", best: "Least cash needed to move in", get: movePerPerson, show: v => fmt(v) + " per person" },
  ];
}

export interface Scored { t: TrackerItem; l: Listing; parts: Record<string, { v: number; s: number }>; score: number; flagged: boolean }

export function scoreAll(items: TrackerItem[], prio: Priorities, F: Factor[]): Scored[] {
  const clean = items.filter(t => !t.listing.flags.length).map(t => t.listing);
  const base = clean.length ? clean : items.map(t => t.listing);
  const range: Record<string, { min: number; max: number }> = {};
  F.forEach(f => { const vals = base.map(f.get).filter(Number.isFinite); range[f.k] = { min: Math.min(...vals), max: Math.max(...vals) }; });
  const ws = F.reduce((s, f) => s + prio[f.k], 0);
  return items.map(t => {
    const l = t.listing, parts: Scored["parts"] = {};
    F.forEach(f => {
      const v = f.get(l), r = range[f.k];
      let s: number;
      if (!Number.isFinite(v)) s = 0.2;
      else if (!Number.isFinite(r.min) || r.max === r.min) s = 1;
      else s = 0.2 + 0.8 * clamp((r.max - v) / (r.max - r.min), 0, 1);
      parts[f.k] = { v, s };
    });
    const flagged = l.flags.length > 0;
    const score = flagged || !ws ? 0 : Math.round(F.reduce((s, f) => s + prio[f.k] * parts[f.k].s, 0) / ws * 100);
    return { t, l, parts, score, flagged };
  }).sort((a, b) => b.score - a.score);
}
