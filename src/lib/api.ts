import { accessToken } from "./supabase";
import type { Mode } from "./types";

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await accessToken();
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(data.error || `Request failed (${r.status})`, r.status);
  return data as T;
}

export interface GeocodeResult { found: boolean; name?: string; formatted?: string; city?: string; st?: string; hood?: string; lat?: number; lng?: number }
export const geocodeApi = (query: string, near?: { lat: number; lng: number }) => post<GeocodeResult>("/api/geocode", { query, near });

export const commuteApi = (origins: Array<{ id: string; lat: number; lng: number }>, dest: { lat: number; lng: number }, mode: Mode) =>
  post<{ minutes: Record<string, number | null> }>("/api/commute", { origins, dest, mode });

export interface ParsedListing {
  is_listing: boolean; title: string; street_address: string; neighborhood: string; city: string;
  unit_type: "room" | "studio" | "apartment"; bedrooms: number; rent: number; utilities: number; utilities_included: boolean;
  other_monthly_fees: number; other_fees_note: string; security_deposit: number; last_month_required: boolean;
  broker_fee: number; application_fee: number; holding_deposit: number; available_date: string; lease: string;
  source: string; estimated_fields: string[]; scam_signs: string[]; questions_to_ask: string[];
}
export interface PastedImage { media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; data: string }
export const parseListingApi = (text: string, images: PastedImage[], near?: { short: string; city: string; lat: number; lng: number }) =>
  post<{ parsed: ParsedListing; location: { lat: number; lng: number; hood?: string; city?: string } | null }>("/api/parse-listing", { text, images, near });
