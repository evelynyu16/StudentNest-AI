// Turns a pasted listing (post text, screenshots, or a link) into a structured StudentNest listing with OpenAI GPT.
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { json, readJson, requireUser } from "./_lib/http";
import { geocode } from "./geocode";

const ParsedListing = z.object({
  is_listing: z.boolean().describe("false if the text is not a rental listing at all"),
  title: z.string().describe("short descriptive title under 60 characters, e.g. 'Sunny 2BR near Fenway with laundry'"),
  street_address: z.string().describe("street address as written, or empty string if not stated"),
  neighborhood: z.string().describe("neighborhood if stated or obvious from the address, else empty string"),
  city: z.string().describe("'City, ST' if known, else empty string"),
  unit_type: z.enum(["room", "studio", "apartment"]).describe("room = private room in a shared apartment"),
  bedrooms: z.number().int().describe("bedrooms in the whole unit; 0 for a studio; 1 for a room"),
  rent: z.number().describe("monthly rent in USD for what is being offered (the room for a room listing, the whole unit otherwise)"),
  utilities: z.number().describe("monthly utilities in USD; if not included and not stated, a typical local estimate"),
  utilities_included: z.boolean(),
  other_monthly_fees: z.number().describe("parking, amenity, internet or other recurring fees in USD, 0 if none"),
  other_fees_note: z.string().describe("what the other monthly fees are for, or empty string"),
  security_deposit: z.number(),
  last_month_required: z.boolean(),
  broker_fee: z.number().describe("broker fee the tenant is asked to pay, 0 if none stated"),
  application_fee: z.number(),
  holding_deposit: z.number().describe("any deposit or payment requested before signing or viewing"),
  available_date: z.string().describe("YYYY-MM-DD move-in date, or empty string if not stated"),
  lease: z.string().describe("lease length, e.g. '12 months' or '4 months (sublet)'"),
  source: z.string().describe("site or channel the post came from, e.g. Zillow, Craigslist, Facebook group, WeChat group, or 'Pasted text'"),
  estimated_fields: z.array(z.string()).describe("names of fields above that were estimated rather than read from the post"),
  scam_signs: z.array(z.string()).describe("concrete rental-scam warning signs found in this post; empty if none"),
  questions_to_ask: z.array(z.string()).describe("2-4 short questions the student should ask before paying anything"),
});
type Parsed = z.infer<typeof ParsedListing>;

const SYSTEM = `You read apartment listings for university students and turn them into structured data so they can compare the true cost.
Rules:
- Use only what the post says. When a cost is not stated, estimate a typical value for that city and list the field in estimated_fields. Never invent an address.
- Money is monthly USD unless the post clearly says otherwise; convert weekly rent to monthly (x 4.33).
- security_deposit: if the post says "first, last and security", security equals one month's rent unless a number is given.
- scam_signs: flag only concrete signs, such as rent far below the area, requests to wire money or pay with gift cards or crypto, paying before a viewing, an owner who is abroad and can't show the unit, pressure to decide immediately, or a mismatch between photos and description. Do not flag ordinary listings.
- questions_to_ask: practical questions specific to this listing (who pays the broker fee, what utilities cost, whether the sublet is approved in writing, and so on).
- If a link is given, open it with web search and read the listing. If the page can't be read, work from whatever text the student pasted and say so in questions_to_ask.`;

interface Body {
  text?: string;
  images?: Array<{ media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; data: string }>;
  near?: { short: string; city: string; lat: number; lng: number };
}

// Cheap, vision-capable default. Override with OPENAI_MODEL in .env.local.
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export async function POST(req: Request) {
  const auth = await requireUser(req); if (!auth.ok) return auth.res;
  if (!process.env.OPENAI_API_KEY) return json({ error: "AI parsing isn't configured on this server (OPENAI_API_KEY is missing)." }, 503);
  const body = await readJson<Body>(req);
  const text = (body?.text || "").trim().slice(0, 20000);
  const images = (body?.images || []).slice(0, 4);
  if (!text && !images.length) return json({ error: "Paste a listing or add a screenshot." }, 400);

  const hasUrl = /https?:\/\/\S+/i.test(text);
  const content: OpenAI.Responses.ResponseInputContent[] = [
    ...images.map(im => ({ type: "input_image" as const, detail: "auto" as const, image_url: `data:${im.media_type};base64,${im.data}` })),
    { type: "input_text", text:
      (body?.near ? `The student is searching near ${body.near.short}${body.near.city ? ` (${body.near.city})` : ""}.\n` : "") +
      `Here is the listing they pasted${images.length ? " (plus screenshots above)" : ""}:\n<listing>\n${text || "(see screenshots)"}\n</listing>` },
  ];

  const client = new OpenAI();
  let parsed: Parsed | null = null;
  try {
    const res = await client.responses.parse({
      model: MODEL,
      instructions: SYSTEM,
      input: [{ role: "user", content }],
      tools: hasUrl ? [{ type: "web_search" }] : undefined,
      text: { format: zodTextFormat(ParsedListing, "listing") },
    });
    const refused = res.output.some(o => o.type === "message" && o.content.some(c => c.type === "refusal"));
    if (refused) return json({ error: "The AI couldn't read this post. Try pasting just the listing text." }, 422);
    parsed = res.output_parsed;
  } catch (e) {
    if (e instanceof OpenAI.RateLimitError) return json({ error: "Too many requests right now (or the OpenAI balance is used up). Try again later." }, 429);
    if (e instanceof OpenAI.AuthenticationError) return json({ error: "The OpenAI API key is invalid. Check OPENAI_API_KEY." }, 502);
    if (e instanceof OpenAI.APIError) return json({ error: `AI service error (${e.status}).` }, 502);
    throw e;
  }
  if (!parsed) return json({ error: "Couldn't turn this into a listing. Try pasting more of the post." }, 422);
  if (!parsed.is_listing) return json({ error: "This doesn't look like a rental listing." }, 422);

  // Locate the address so the listing shows on the map and gets a real commute time.
  let loc: { lat: number; lng: number; hood?: string; city?: string } | null = null;
  const addr = [parsed.street_address, parsed.neighborhood, parsed.city].filter(Boolean).join(", ");
  if (parsed.street_address && process.env.GOOGLE_MAPS_SERVER_KEY) {
    try {
      const g = await geocode(addr, body?.near);
      if (g.found && g.lat != null && g.lng != null) loc = { lat: g.lat, lng: g.lng, hood: g.hood, city: g.city };
    } catch { /* leave unlocated; the student can still save it */ }
  }
  return json({ parsed, location: loc });
}
