// Real travel times from each listing to campus, using the Google Routes API route matrix.
import { json, readJson, requireUser } from "./_lib/http.js";

type Mode = "transit" | "walking" | "bicycling";
interface Body { origins: Array<{ id: string; lat: number; lng: number }>; dest: { lat: number; lng: number }; mode: Mode }

const TRAVEL: Record<Mode, string> = { transit: "TRANSIT", walking: "WALK", bicycling: "BICYCLE" };

/** Next weekday at 8:30 local server time, so transit times reflect a morning class commute. */
function nextMorning() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 30, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export async function POST(req: Request) {
  const auth = await requireUser(req); if (!auth.ok) return auth.res;
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return json({ error: "Travel times aren't configured on this server." }, 503);
  const body = await readJson<Body>(req);
  if (!body || !Array.isArray(body.origins) || !body.dest || !(body.mode in TRAVEL)) return json({ error: "Bad request" }, 400);
  const origins = body.origins.filter(o => Number.isFinite(o.lat) && Number.isFinite(o.lng)).slice(0, 25);
  if (!origins.length) return json({ minutes: {} });

  const point = (p: { lat: number; lng: number }) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });
  const payload: Record<string, unknown> = {
    origins: origins.map(point), destinations: [point(body.dest)], travelMode: TRAVEL[body.mode],
  };
  if (body.mode === "transit") payload.departureTime = nextMorning();

  const r = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "originIndex,destinationIndex,duration,condition" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) return json({ error: "Travel time lookup failed." }, 502);
  const rows = await r.json() as Array<{ originIndex?: number; duration?: string; condition?: string }>;
  const minutes: Record<string, number | null> = {};
  for (const row of rows) {
    const o = origins[row.originIndex ?? 0];
    if (!o) continue;
    const secs = row.duration ? parseInt(row.duration, 10) : NaN;
    minutes[o.id] = row.condition === "ROUTE_EXISTS" && Number.isFinite(secs) ? Math.round(secs / 60) : null;
  }
  return json({ minutes });
}
