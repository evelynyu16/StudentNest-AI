import type { Listing, Mode } from "./types";

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const MODE_TEXT: Record<Mode, string> = { transit: "by transit", walking: "walking", bicycling: "by bike" };

export const cap = (l: Listing) => Math.max(l.beds, 1);
export const monthly = (l: Listing) => l.rent + l.util + l.fees;
export const perPerson = (l: Listing) => monthly(l) / (l.room ? 1 : cap(l));
export const moveInCash = (l: Listing) => l.rent + (l.last ? l.rent : 0) + l.security + l.broker + l.app + (l.holding || 0);
export const movePerPerson = (l: Listing) => moveInCash(l) / (l.room ? 1 : cap(l));
export const bedsText = (l: Listing) => l.room ? "a private room" : l.beds === 0 ? "a studio" : l.beds + (l.beds === 1 ? " bedroom" : " bedrooms");
export const typeLabel = (l: Listing) => l.room ? "Private room" : l.beds === 0 ? "Studio" : l.beds + (l.beds === 1 ? " bedroom" : " bedrooms");

export const availText = (a: string) => !a ? "date not stated" :
  new Date((a.length === 7 ? a + "-01" : a) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const daysApart = (a: string, b: string) => Math.round((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / 86400000);
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed: number) {
  return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
