import type { ParsedListing } from "./api";
import type { Anchor, Listing } from "./types";

/** Converts the AI's parse into an editable StudentNest listing. */
export function listingFromParsed(
  p: ParsedListing, loc: { lat: number; lng: number; hood?: string; city?: string } | null,
  anchor: Anchor, rawText: string, url?: string,
): Listing {
  const room = p.unit_type === "room";
  const beds = room ? 1 : p.unit_type === "studio" ? 0 : Math.max(1, Math.round(p.bedrooms || 1));
  const n = (v: number) => Math.max(0, Math.round(Number(v) || 0));
  return {
    id: "p-" + (crypto.randomUUID?.() ?? Date.now().toString(36)),
    origin: "pasted",
    title: p.title || "Pasted listing",
    street: p.street_address, hood: p.neighborhood || loc?.hood || "", city: p.city || loc?.city || anchor.city,
    lat: loc?.lat ?? null, lng: loc?.lng ?? null,
    rent: n(p.rent), beds, room, util: p.utilities_included ? 0 : n(p.utilities),
    fees: n(p.other_monthly_fees), feeNote: p.other_fees_note,
    app: n(p.application_fee), security: n(p.security_deposit), last: !!p.last_month_required,
    broker: n(p.broker_fee), holding: n(p.holding_deposit),
    avail: /^\d{4}-\d{2}-\d{2}$/.test(p.available_date) ? p.available_date : "",
    lease: p.lease || "Not stated", source: p.source || "Pasted text", url,
    flags: p.scam_signs || [], note: "",
    anchor, rawText, estimated: p.estimated_fields || [], questions: p.questions_to_ask || [],
    createdAt: new Date().toISOString(),
  };
}
