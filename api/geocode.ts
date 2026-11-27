// Turns a school name or address into coordinates with the Google Geocoding API.
import { json, readJson, requireUser } from "./_lib/http.js";

interface Body { query: string; near?: { lat: number; lng: number } }

export interface GeocodeResult {
  found: boolean; name?: string; formatted?: string; city?: string; st?: string;
  hood?: string; lat?: number; lng?: number;
}

export async function geocode(query: string, near?: { lat: number; lng: number }): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_SERVER_KEY is not set");
  const p = new URLSearchParams({ address: query, key });
  if (near) {
    const d = 0.25; // bias results toward the area the student is searching in
    p.set("bounds", `${near.lat - d},${near.lng - d}|${near.lat + d},${near.lng + d}`);
  }
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${p}`);
  const data = await r.json() as { status: string; results: Array<{
    formatted_address: string; geometry: { location: { lat: number; lng: number } };
    address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
  }> };
  if (data.status !== "OK" || !data.results.length) return { found: false };
  const g = data.results[0];
  const comp = (t: string, short = false) => { const c = g.address_components.find(c => c.types.includes(t)); return c ? (short ? c.short_name : c.long_name) : ""; };
  const city = comp("locality") || comp("postal_town") || comp("sublocality") || comp("administrative_area_level_2");
  const st = comp("administrative_area_level_1", true);
  const establishment = g.address_components.find(c => c.types.includes("establishment") || c.types.includes("point_of_interest"));
  return {
    found: true,
    name: establishment?.long_name || g.formatted_address.split(",")[0],
    formatted: g.formatted_address,
    city: [city, st].filter(Boolean).join(", "), st,
    hood: comp("neighborhood") || comp("sublocality_level_1") || comp("sublocality"),
    lat: g.geometry.location.lat, lng: g.geometry.location.lng,
  };
}

export async function POST(req: Request) {
  const auth = await requireUser(req); if (!auth.ok) return auth.res;
  const body = await readJson<Body>(req);
  const q = body?.query?.trim();
  if (!q || q.length > 300) return json({ error: "Enter a school or address." }, 400);
  if (!process.env.GOOGLE_MAPS_SERVER_KEY) return json({ error: "Address lookup isn't configured on this server." }, 503);
  try { return json(await geocode(q, body?.near)); }
  catch { return json({ error: "Address lookup failed. Try again." }, 502); }
}
