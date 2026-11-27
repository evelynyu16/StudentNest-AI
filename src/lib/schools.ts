// Pre-geocoded schools for instant search. Any other school or address goes through /api/geocode.
export interface Place { label: string; short: string; lat: number; lng: number }
export interface School {
  key: string; name: string; city: string; st: string; short: string; alias: string[];
  lat: number; lng: number; idx: number; hoods: string[]; places: Place[];
  label: string; known: boolean; located?: boolean;
}
type Raw = Omit<School, "key" | "label" | "known">;
const P = (label: string, short: string, lat: number, lng: number): Place => ({ label, short, lat, lng });
const BOS_PLACES = [P("Vertex Pharmaceuticals, 50 Northern Ave, Boston","Vertex (Seaport)",42.3512,-71.0441), P("Massachusetts General Hospital, 55 Fruit St, Boston","Mass General",42.3626,-71.0686), P("Wayfair, 4 Copley Place, Boston","Wayfair (Copley)",42.3478,-71.0763), P("Boston Children’s Hospital, 300 Longwood Ave, Boston","Boston Children’s",42.3374,-71.1056)];
const SJ_PLACES = [P("Adobe, 345 Park Ave, San Jose","Adobe",37.3307,-121.8939), P("San Jose Mineta Airport, 1701 Airport Blvd, San Jose","SJC Airport",37.3639,-121.9289)];
const SEA_PLACES = [P("Amazon, 2121 7th Ave, Seattle","Amazon HQ",47.6162,-122.3386), P("Fred Hutch, 1100 Fairview Ave N, Seattle","Fred Hutch",47.6275,-122.3307)];
const RAW: Raw[] = [
  { name:"Northeastern University", city:"Boston, MA", st:"MA", short:"Northeastern", alias:["neu","northeastern boston"], lat:42.3398, lng:-71.0892, idx:1.0, hoods:["Fenway","Mission Hill","Back Bay","South End","Roxbury","Jamaica Plain"], places:BOS_PLACES },
  { name:"Northeastern University", city:"Seattle, WA", st:"WA", short:"Northeastern Seattle", alias:["neu seattle","northeastern seattle"], lat:47.6219, lng:-122.3375, idx:0.95, hoods:["South Lake Union","Capitol Hill","Eastlake","Queen Anne","Belltown","Fremont"], places:SEA_PLACES },
  { name:"Northeastern University", city:"San Jose, CA", st:"CA", short:"Northeastern Silicon Valley", alias:["neu silicon valley","northeastern san jose","northeastern silicon valley"], lat:37.3366, lng:-121.8895, idx:1.1, hoods:["Downtown","Japantown","Naglee Park","Willow Glen","Rose Garden","North San Jose"], places:SJ_PLACES },
  { name:"San José State University", city:"San Jose, CA", st:"CA", short:"SJSU", alias:["sjsu","san jose state"], lat:37.3352, lng:-121.8811, idx:1.05, hoods:["Downtown","Naglee Park","Japantown","Spartan Keyes","Willow Glen","Alum Rock"], places:SJ_PLACES },
  { name:"Stanford University", city:"Stanford, CA", st:"CA", short:"Stanford", alias:["stanford"], lat:37.4275, lng:-122.1697, idx:1.3, hoods:["College Terrace","Palo Alto","Menlo Park","Mountain View","Redwood City","East Palo Alto"], places:[P("Google, 1600 Amphitheatre Pkwy, Mountain View","Google",37.4220,-122.0841), P("Meta, 1 Hacker Way, Menlo Park","Meta",37.4848,-122.1484)] },
  { name:"University of California, Berkeley", city:"Berkeley, CA", st:"CA", short:"UC Berkeley", alias:["berkeley","ucb","cal"], lat:37.8719, lng:-122.2585, idx:1.1, hoods:["Southside","Northside","Elmwood","Downtown Berkeley","Rockridge","Temescal"], places:[P("Lawrence Berkeley National Lab, 1 Cyclotron Rd, Berkeley","Berkeley Lab",37.8761,-122.2467), P("Downtown Oakland, 14th St & Broadway, Oakland","Downtown Oakland",37.8044,-122.2712)] },
  { name:"University of Washington", city:"Seattle, WA", st:"WA", short:"UW", alias:["uw","udub"], lat:47.6553, lng:-122.3035, idx:0.9, hoods:["U District","Wallingford","Ravenna","Roosevelt","Fremont","Capitol Hill"], places:[P("UW Medical Center, 1959 NE Pacific St, Seattle","UW Medical Center",47.6497,-122.3070), SEA_PLACES[0]] },
  { name:"University of California, Los Angeles", city:"Los Angeles, CA", st:"CA", short:"UCLA", alias:["ucla"], lat:34.0689, lng:-118.4452, idx:1.15, hoods:["Westwood","Sawtelle","Palms","Brentwood","Culver City","Santa Monica"], places:[P("Santa Monica Pier, 200 Santa Monica Pier, Santa Monica","Santa Monica",34.0094,-118.4973)] },
  { name:"University of Southern California", city:"Los Angeles, CA", st:"CA", short:"USC", alias:["usc"], lat:34.0224, lng:-118.2851, idx:0.95, hoods:["University Park","West Adams","Exposition Park","Koreatown","Downtown LA","Jefferson Park"], places:[P("Grand Park, 200 N Grand Ave, Los Angeles","Downtown LA",34.0561,-118.2468)] },
  { name:"New York University", city:"New York, NY", st:"NY", short:"NYU", alias:["nyu"], lat:40.7295, lng:-73.9965, idx:1.35, hoods:["Greenwich Village","East Village","Lower East Side","Chelsea","Williamsburg","SoHo"], places:[P("Google NYC, 111 8th Ave, New York","Google NYC",40.7414,-74.0033), P("Wall Street, 11 Wall St, New York","Wall Street",40.7060,-74.0088)] },
  { name:"Columbia University", city:"New York, NY", st:"NY", short:"Columbia", alias:["columbia"], lat:40.8075, lng:-73.9626, idx:1.2, hoods:["Morningside Heights","Harlem","Upper West Side","Hamilton Heights","Manhattan Valley","Inwood"], places:[P("Mount Sinai Hospital, 1 Gustave L. Levy Pl, New York","Mount Sinai",40.7900,-73.9526)] },
  { name:"University of Chicago", city:"Chicago, IL", st:"IL", short:"UChicago", alias:["uchicago"], lat:41.7886, lng:-87.5987, idx:0.7, hoods:["Hyde Park","Kenwood","Woodlawn","Bronzeville","South Shore","Washington Park"], places:[] },
  { name:"University of Texas at Austin", city:"Austin, TX", st:"TX", short:"UT Austin", alias:["ut austin","ut"], lat:30.2849, lng:-97.7341, idx:0.75, hoods:["West Campus","North Campus","Hyde Park","East Austin","Riverside","Downtown"], places:[P("Texas State Capitol, 1100 Congress Ave, Austin","State Capitol",30.2747,-97.7404)] },
  { name:"Georgia Institute of Technology", city:"Atlanta, GA", st:"GA", short:"Georgia Tech", alias:["georgia tech","gatech"], lat:33.7756, lng:-84.3963, idx:0.7, hoods:["Home Park","Midtown","West Midtown","Old Fourth Ward","Atlantic Station","Inman Park"], places:[] },
  { name:"University of Michigan", city:"Ann Arbor, MI", st:"MI", short:"UMich", alias:["umich","michigan"], lat:42.2780, lng:-83.7382, idx:0.75, hoods:["South University","Kerrytown","Burns Park","Old West Side","Lower Town","Water Hill"], places:[P("Michigan Medicine, 1500 E Medical Center Dr, Ann Arbor","Michigan Medicine",42.2843,-83.7280)] },
  { name:"Carnegie Mellon University", city:"Pittsburgh, PA", st:"PA", short:"CMU", alias:["cmu","carnegie mellon"], lat:40.4433, lng:-79.9436, idx:0.6, hoods:["Oakland","Shadyside","Squirrel Hill","Bloomfield","Greenfield","Lawrenceville"], places:[P("UPMC Presbyterian, 200 Lothrop St, Pittsburgh","UPMC",40.4423,-79.9605)] },
  { name:"University of Toronto", city:"Toronto, ON", st:"ON", short:"U of T", alias:["uoft","u of t","toronto"], lat:43.6629, lng:-79.3957, idx:0.9, hoods:["The Annex","Harbord Village","Kensington Market","Chinatown","Yorkville","Little Italy"], places:[P("CN Tower, 290 Bremner Blvd, Toronto","CN Tower",43.6426,-79.3871)] },
  { name:"Massachusetts Institute of Technology", city:"Cambridge, MA", st:"MA", short:"MIT", alias:["mit"], lat:42.3601, lng:-71.0942, idx:1.1, hoods:["Cambridgeport","Kendall Square","Central Square","East Cambridge","Back Bay","Somerville"], places:BOS_PLACES },
  { name:"Boston University", city:"Boston, MA", st:"MA", short:"BU", alias:["bu"], lat:42.3505, lng:-71.1054, idx:1.0, hoods:["Allston","Brighton","Brookline","Fenway","Kenmore","Back Bay"], places:BOS_PLACES },
  { name:"Harvard University", city:"Cambridge, MA", st:"MA", short:"Harvard", alias:["harvard"], lat:42.3770, lng:-71.1167, idx:1.15, hoods:["Harvard Square","Porter Square","Central Square","Somerville","Allston","Inman Square"], places:BOS_PLACES }
];
export const SCHOOLS: School[] = RAW.map((s, i) => ({ ...s, key: "s" + i, label: `${s.name}, ${s.city}`, known: true }));
export const GENERIC_HOODS = ["Near campus", "Downtown", "North side", "East side", "Old town", "Riverside"];
export const SAMPLE_KEYS = [0, 2, 4, 9, 12, 16].map(i => SCHOOLS[i].key);

export function findSchool(q: string, exactOnly: boolean): School | null {
  q = q.trim().toLowerCase(); if (!q) return null;
  const exact = SCHOOLS.find(s => s.label.toLowerCase() === q || s.alias.includes(q) || s.short.toLowerCase() === q);
  if (exact || exactOnly) return exact || null;
  const hits = SCHOOLS.filter(s => s.label.toLowerCase().includes(q));
  return hits.length === 1 ? hits[0] : null;
}
