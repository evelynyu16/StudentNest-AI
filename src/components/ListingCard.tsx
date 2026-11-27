import type { Commute } from "../hooks/useCommutes";
import { availText, bedsText, cap, fmt, MODE_TEXT, monthly, moveInCash, perPerson, typeLabel } from "../lib/format";
import { directionsUrl, placeUrl, pointUrl } from "../lib/geo";
import type { Listing, Mode } from "../lib/types";

const SITE: Record<string, string> = { "Zillow": "zillow.com", "Apartments.com": "apartments.com", "Craigslist": "craigslist.org", "Facebook group": "facebook.com" };
const g = (q: string) => "https://www.google.com/search?q=" + encodeURIComponent(q);

function brokerTip(l: Listing) {
  return l.anchor.st === "MA"
    ? "Since August 1, 2025, Massachusetts requires whoever hired the broker to pay the fee. Ask who hired this broker before agreeing to pay."
    : "Rules on who pays a broker fee differ by city and state. Ask who hired this broker and check your local rules before agreeing to pay.";
}

interface Props {
  l: Listing; mode: Mode; commute: Commute | null; saved: boolean; open: boolean; highlighted: boolean;
  onSave: () => void; onToggle: () => void; onHover: () => void;
}

export function ListingCard({ l, mode, commute, saved, open, highlighted, onSave, onToggle, onHover }: Props) {
  const m = monthly(l) || 1, pp = perPerson(l), n = l.room ? 1 : cap(l);
  const place = l.city || l.anchor.city || l.anchor.short;
  const where = [l.street, l.hood, l.city].filter(Boolean).join(", ");
  const listed = `Listed rent ${fmt(l.rent)} for ${bedsText(l)}` + (l.util ? `, plus ${fmt(l.util)} utilities` : "") + (l.fees ? ` and ${fmt(l.fees)} ${(l.feeNote || "fees").toLowerCase()}` : "");
  const cash = moveInCash(l);
  const rows = ([["First month", l.rent], l.last ? ["Last month", l.rent] : null, l.security ? ["Security deposit", l.security] : null,
    l.broker ? ["Broker fee (as stated in the listing)", l.broker] : null, l.app ? ["Application fee", l.app] : null,
    l.holding ? ["Holding deposit", l.holding] : null].filter(Boolean)) as [string, number][];
  const located = !(l.anchor.lat === 0 && l.anchor.lng === 0); // campus wasn't found: map is illustrative
  const has = located && l.lat != null && l.lng != null;
  const site = SITE[l.source] ? ` site:${SITE[l.source]}` : "";
  const links: [string, string][] = [
    [has ? pointUrl({ lat: l.lat!, lng: l.lng! }) : placeUrl(`${where || l.title}, ${place}`), "View on Google Maps"],
    ...(has ? [[directionsUrl({ lat: l.lat!, lng: l.lng! }, l.anchor, mode), "Route to campus"] as [string, string]] : []),
    l.url ? [l.url, `Original listing on ${l.source}`] : l.origin === "sample" ? [g(`"${l.street}" ${l.hood} ${place} apartment for rent${site}`), `Original listing on ${l.source}`] : null,
  ].filter(Boolean) as [string, string][];
  const est = new Set((l.estimated || []).map(s => s.toLowerCase()));

  return (
    <article className={"card" + (highlighted ? " hl" : "")} id={"card-" + l.id} onMouseEnter={onHover}>
      <div className="card-head">
        <div>
          {l.origin === "pasted" && <span className="badge">Pasted by you</span>}
          <h2>{l.title}</h2>
          <div className="where">{where || "Address not stated"}. Available {availText(l.avail)}</div>
        </div>
        <div className="price"><em className="utype">{typeLabel(l)}</em><strong>{fmt(pp)}</strong><span>per person / month{n > 1 ? " (1 per bedroom)" : ""}</span></div>
      </div>
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${l.rent / m * 100}%`, background: "var(--seg-rent)" }} />
        <i style={{ width: `${l.util / m * 100}%`, background: "var(--seg-util)" }} />
        <i style={{ width: `${l.fees / m * 100}%`, background: "var(--seg-fee)" }} />
      </div>
      <div className="legend">{listed}{est.has("utilities") ? " (utilities estimated)" : ""}</div>
      <div className="commute">
        {commute
          ? <span><strong>{commute.min} min</strong> {MODE_TEXT[mode]} to {l.anchor.short}{!commute.real && <span className="muted"> (estimate)</span>}</span>
          : <span className="muted">No address in the post, so the commute can’t be calculated.</span>}
      </div>
      {l.flags.length > 0 && (
        <div className="flag" role="note"><strong>Possible rental scam: don’t send money yet</strong>
          <ul>{l.flags.map(f => <li key={f}>{f}</li>)}</ul></div>
      )}
      <div className="links">{links.map(([h, t]) => <a key={t} href={h} target="_blank" rel="noopener">{t} ↗</a>)}</div>
      <div className="actions">
        <button className={"btn " + (saved ? "saved" : "primary")} onClick={onSave}>{saved ? "✓ Saved to tracker" : "Save to tracker"}</button>
        <button className="btn" onClick={onToggle} aria-expanded={open}>{open ? "Hide details" : "Cost details"}</button>
      </div>
      {open && (
        <div className="details">
          <dl>
            {rows.map(([k, v]) => <FragmentRow key={k} k={k} v={v} />)}
            <dt className="total">Cash needed to move in</dt><dd className="total">{fmt(cash)}{n > 1 ? ` (${fmt(cash / n)} each)` : ""}</dd>
          </dl>
          {l.broker > 0 && <div className="tip">{brokerTip(l)}</div>}
          {l.note && <div className="tip">{l.note}</div>}
          {!!l.questions?.length && <div className="tip"><strong>Ask before you pay</strong><ul className="rec-list">{l.questions.map(q => <li key={q}>{q}</li>)}</ul></div>}
          {!!l.estimated?.length && <div className="meta">Estimated by AI, not stated in the post: {l.estimated.join(", ")}.</div>}
          <div className="meta">Lease: {l.lease}. Found on {l.source}.</div>
        </div>
      )}
    </article>
  );
}

function FragmentRow({ k, v }: { k: string; v: number }) {
  return <><dt>{k}</dt><dd>{fmt(v)}</dd></>;
}
