import type { Mode } from "./types";

export interface LatLng { lat: number; lng: number }

/** km offsets of a point from an origin (east = +dx, north = +dy) */
export const toXY = (o: LatLng, p: LatLng) => ({ dx: (p.lng - o.lng) * 111.32 * Math.cos(o.lat * Math.PI / 180), dy: (p.lat - o.lat) * 110.57 });
export const toLL = (o: LatLng, dx: number, dy: number): LatLng => ({ lat: o.lat + dy / 110.57, lng: o.lng + dx / (111.32 * Math.cos(o.lat * Math.PI / 180)) });
export const kmBetween = (a: LatLng, b: LatLng) => { const { dx, dy } = toXY(a, b); return Math.hypot(dx, dy); };

/** Rough door-to-door estimate, used until (or when) Google's travel times are unavailable. */
export function estimateMinutes(km: number, mode: Mode) {
  if (mode === "walking") return Math.round(km * 1.25 / 5 * 60);
  if (mode === "bicycling") return Math.round(2 + km * 1.3 / 15 * 60);
  return Math.round(7 + km * 1.3 / 16 * 60);
}

export function directionsUrl(from: LatLng, to: LatLng, mode: Mode) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat.toFixed(5)},${from.lng.toFixed(5)}&destination=${to.lat.toFixed(5)},${to.lng.toFixed(5)}&travelmode=${mode}`;
}
export const placeUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const pointUrl = (p: LatLng) => `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
