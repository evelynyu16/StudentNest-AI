export type Mode = "transit" | "walking" | "bicycling";
export type Status = "Interested" | "Contacted" | "Toured" | "Applied";
export const STATUSES: Status[] = ["Interested", "Contacted", "Toured", "Applied"];

/** Where a listing's commute is measured to (the school it was found near). */
export interface Anchor { short: string; city: string; st: string; lat: number; lng: number }

export interface Listing {
  id: string;
  origin: "sample" | "pasted";
  title: string;
  street: string;       // street address, or "" when unknown
  hood: string;         // neighborhood, or "" when unknown
  city: string;
  lat: number | null;   // null when the address could not be located
  lng: number | null;
  rent: number;         // whole-unit monthly rent
  beds: number;         // 0 = studio
  room: boolean;        // private room in a shared apartment
  util: number;         // estimated monthly utilities for the unit
  fees: number;         // other monthly fees
  feeNote: string;
  app: number;          // application fee
  security: number;
  last: boolean;        // last month's rent due at signing
  broker: number;
  holding: number;
  avail: string;        // YYYY-MM-DD, or "" when unknown
  lease: string;
  source: string;
  url?: string;
  flags: string[];      // rental-scam warning signs
  note: string;
  anchor: Anchor;
  /** Pasted listings only */
  rawText?: string;
  estimated?: string[]; // fields the AI had to estimate rather than read from the post
  questions?: string[]; // things to ask the landlord before paying
  createdAt?: string;
}

export interface TrackerItem { status: Status; note: string; listing: Listing }
export type Tracker = Record<string, TrackerItem>;

export interface Filters {
  mode: Mode; maxCommute: number; budget: number; group: string; movein: string; sort: "cost" | "commute";
}
export const DEFAULT_FILTERS: Filters = { mode: "transit", maxCommute: 30, budget: 2000, group: "any", movein: "", sort: "cost" };

export type Priorities = Record<"cost" | "commute" | "cash", number>;
export const DEFAULT_PRIORITIES: Priorities = { cost: 2, commute: 1, cash: 1 };
