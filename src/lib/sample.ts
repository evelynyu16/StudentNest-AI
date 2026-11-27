// Sample listings, generated deterministically around a school so the search view has
// something to show. Real listings come from what students paste in (see PasteListing).
import type { Listing } from "./types";
import type { School } from "./schools";
import { GENERIC_HOODS } from "./schools";
import { clamp, hash, rng } from "./format";
import { toLL } from "./geo";

const TYPES: (number | "room")[] = [2, 3, 1, 0, 2, 4, "room", 3, 2, 1, 2, "room"];
const BASE: Record<number, number> = { 0: 2300, 1: 2800, 2: 3300, 3: 4000, 4: 4800 };
const UTIL: Record<number, number> = { 0: 90, 1: 120, 2: 180, 3: 250, 4: 320 };
const STREETS = ["Maple St", "Oak Ave", "Park St", "Washington St", "Elm St", "Pine St", "Cedar Ave", "Lake St", "Hill Rd", "Main St", "Union St", "College Ave", "Grove St", "Chestnut St"];
const ADJ = ["Sunny", "Renovated", "Quiet", "Spacious", "Bright", "Cozy"];
const FEAT = ["with in-unit laundry", "near transit", "with a porch", "with parking", "on the top floor", "with a garden"];
const SOURCES = ["Zillow", "Apartments.com", "University listings", "Craigslist", "Facebook group"];

export function sampleListings(s: School): Listing[] {
  const r = rng(hash(s.label));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const hoods = (s.hoods.length ? s.hoods : GENERIC_HOODS).map((h, i) => ({ h, ang: i / 6 * 2 * Math.PI + r() * 0.6, dist: i === 0 ? 0.7 : 1.6 + r() * 4.2 }));
  const anchor = { short: s.short, city: s.city, st: s.st, lat: s.lat, lng: s.lng };
  return TYPES.map((t, i) => {
    const hp = hoods[i % hoods.length];
    const dx = Math.cos(hp.ang) * hp.dist + (r() - 0.5) * 1.1;
    const dy = Math.sin(hp.ang) * hp.dist + (r() - 0.5) * 1.1;
    const dist = Math.hypot(dx, dy);
    const room = t === "room";
    const beds = room ? 1 : (t as number);
    const loc = clamp(1.15 - 0.045 * dist, 0.82, 1.15);
    let rent = room ? 1100 * s.idx * loc * (0.9 + r() * 0.2) : BASE[beds] * s.idx * loc * (0.92 + r() * 0.16);
    rent = Math.round(rent / 25) * 25;
    const util = Math.round((room ? 70 : UTIL[beds]) * (0.9 + r() * 0.2) / 10) * 10;
    const app = r() < 0.4 ? 50 : 0;
    const last = !room && r() < 0.6;
    const source = room ? "Facebook group" : pick(SOURCES);
    const title = room ? "Room in shared 4BR (sublet)" : `${pick(ADJ)} ${beds === 0 ? "studio" : beds + "BR"} ${pick(FEAT)}`;
    const street = pick(STREETS);
    const ll = toLL(s, dx, dy);
    return {
      id: `${s.key}-${hash(s.label) % 9973}-${i}`, origin: "sample",
      title, street, hood: hp.h, city: s.city, lat: ll.lat, lng: ll.lng,
      rent, beds, room, util,
      fees: i === 5 ? 150 : i === 8 ? 100 : 0, feeNote: i === 5 ? "Amenity fee" : i === 8 ? "Parking" : "",
      app, security: rent, last, broker: i === 1 ? rent : 0, holding: 0,
      avail: (room || i % 4 === 3) ? ["2027-01-01", "2027-01-15"][i % 2] : i % 5 === 2 ? "2027-06-01" : ["2027-08-15", "2027-09-01"][i % 2],
      lease: room ? "4 months (sublet)" : "12 months",
      source, flags: [], note: room ? "Sublet: ask for written landlord approval before paying." : "",
      anchor,
    } satisfies Listing;
  });
}
