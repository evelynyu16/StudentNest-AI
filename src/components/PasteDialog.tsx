// Paste a listing (text, link, or screenshots) → AI turns it into a StudentNest card → student reviews and saves.
import { useState } from "react";
import { geocodeApi, parseListingApi, type PastedImage } from "../lib/api";
import { fmt, moveInCash, movePerPerson, perPerson } from "../lib/format";
import { listingFromParsed } from "../lib/fromParsed";
import type { School } from "../lib/schools";
import type { Listing } from "../lib/types";
import { Dialog } from "./Dialog";

interface Props { open: boolean; onClose: () => void; school: School; onSave: (l: Listing) => void; needsSignIn: boolean; onSignIn: () => void }

const MAX_IMAGES = 4;

async function toImage(file: File): Promise<PastedImage & { preview: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.85);
  return { media_type: "image/jpeg", data: url.split(",")[1], preview: url };
}

export function PasteDialog({ open, onClose, school, onSave, needsSignIn, onSignIn }: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<Array<PastedImage & { preview: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState<Listing | null>(null);
  const [origStreet, setOrigStreet] = useState("");
  const anchor = { short: school.short, city: school.city, st: school.st, lat: school.lat, lng: school.lng };

  const reset = () => { setText(""); setImages([]); setDraft(null); setErr(""); setBusy(false); };
  const close = () => { reset(); onClose(); };

  const addFiles = async (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith("image/")).slice(0, MAX_IMAGES - images.length);
    if (!imgs.length) return;
    try { const out = await Promise.all(imgs.map(toImage)); setImages(i => [...i, ...out].slice(0, MAX_IMAGES)); }
    catch { setErr("Couldn't read that image. Try a PNG or JPEG screenshot."); }
  };

  const convert = async () => {
    setErr(""); setBusy(true);
    try {
      const url = text.match(/https?:\/\/\S+/)?.[0];
      const r = await parseListingApi(text, images.map(({ media_type, data }) => ({ media_type, data })), { short: school.short, city: school.city, lat: school.lat, lng: school.lng });
      const l = listingFromParsed(r.parsed, r.location, anchor, text, url);
      setDraft(l); setOrigStreet(l.street);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const manual = () => {
    setDraft(listingFromParsed({
      is_listing: true, title: "", street_address: "", neighborhood: "", city: school.city, unit_type: "apartment", bedrooms: 1,
      rent: 0, utilities: 0, utilities_included: false, other_monthly_fees: 0, other_fees_note: "", security_deposit: 0,
      last_month_required: false, broker_fee: 0, application_fee: 0, holding_deposit: 0, available_date: "", lease: "12 months",
      source: "Entered by hand", estimated_fields: [], scam_signs: [], questions_to_ask: [],
    }, null, anchor, text, text.match(/https?:\/\/\S+/)?.[0]));
    setOrigStreet("");
  };

  const save = async () => {
    if (!draft) return;
    let l = { ...draft, title: draft.title.trim() || "Pasted listing" };
    // Re-locate if the student changed or added the address.
    if (l.street && (l.street !== origStreet || l.lat == null)) {
      setBusy(true);
      try {
        const g = await geocodeApi([l.street, l.hood, l.city].filter(Boolean).join(", "), anchor);
        l = g.found && g.lat != null ? { ...l, lat: g.lat, lng: g.lng!, hood: l.hood || g.hood || "" } : { ...l, lat: null, lng: null };
      } catch { /* keep as is; still saveable */ }
      setBusy(false);
    }
    if (!l.street) l = { ...l, lat: null, lng: null };
    onSave(l); close();
  };

  const upd = (p: Partial<Listing>) => setDraft(d => d && { ...d, ...p });
  const num = (k: keyof Listing, label: string, estKey?: string) => (
    <label className={"field" + (estKey && draft?.estimated?.some(e => e.toLowerCase().includes(estKey)) ? " est" : "")}>
      <span>{label}</span>
      <input type="number" min={0} step={1} inputMode="numeric" value={Number(draft![k]) || 0} onChange={e => upd({ [k]: Math.max(0, +e.target.value || 0) } as Partial<Listing>)} />
    </label>
  );

  if (needsSignIn) return (
    <Dialog open={open} onClose={close} title="Paste a listing">
      <p>Sign in to paste listings. We use AI to read each post, and signing in keeps your listings saved across devices.</p>
      <button className="btn primary" onClick={() => { close(); onSignIn(); }}>Sign in</button>
    </Dialog>
  );

  return (
    <Dialog open={open} onClose={close} title={draft ? "Check the details" : "Paste a listing you found"} wide>
      {!draft ? (
        <div className="stack">
          <p className="muted">Copy the whole post from Zillow, Craigslist, Facebook Marketplace, a WeChat or WhatsApp group, or an email. You can also paste screenshots (Ctrl/⌘+V) or a link. We’ll work out the all-in cost, the cash you need to move in, and any scam warning signs.</p>
          <textarea className="paste-area" rows={10} value={text} autoFocus
            placeholder={"e.g. 2BR/1BA in Mission Hill, $3,200/mo, heat & hot water included. First, last, security. Available 9/1. Text 617-555-…"}
            onChange={e => setText(e.target.value)}
            onPaste={e => { const files = [...e.clipboardData.files]; if (files.some(f => f.type.startsWith("image/"))) { e.preventDefault(); addFiles(files); } }} />
          <div className="paste-imgs">
            {images.map((im, i) => (
              <figure key={i}><img src={im.preview} alt={`Screenshot ${i + 1}`} /><button type="button" aria-label="Remove screenshot" onClick={() => setImages(x => x.filter((_, j) => j !== i))}>×</button></figure>
            ))}
            {images.length < MAX_IMAGES && <label className="btn file-btn">Add screenshots<input type="file" accept="image/*" multiple onChange={e => { addFiles([...(e.target.files || [])]); e.target.value = ""; }} /></label>}
          </div>
          {err && <div className="flag" role="alert">{err}</div>}
          <div className="actions">
            <button className="btn primary" disabled={busy || (!text.trim() && !images.length)} onClick={convert}>{busy ? "Reading the listing…" : "Convert with AI"}</button>
            <button className="link-btn" onClick={manual} disabled={busy}>Enter details by hand instead</button>
          </div>
          <p className="meta small">The post is sent to OpenAI’s GPT to extract the details. Don’t paste anything private you don’t want shared, like your own ID or bank info.</p>
        </div>
      ) : (
        <div className="stack">
          {draft.flags.length > 0 && <div className="flag"><strong>Possible rental scam: don’t send money yet</strong><ul>{draft.flags.map(f => <li key={f}>{f}</li>)}</ul></div>}
          <div className="preview-strip">
            <div><strong>{fmt(perPerson(draft))}</strong><span>all-in per person / month</span></div>
            <div><strong>{fmt(moveInCash(draft))}</strong><span>cash to move in{draft.beds > 1 && !draft.room ? ` (${fmt(movePerPerson(draft))} each)` : ""}</span></div>
          </div>
          {!!draft.estimated?.length && <p className="muted small">Fields with a yellow edge were estimated because the post didn’t say. Fix them if you know better.</p>}
          <div className="form-grid">
            <label className="field span2"><span>Title</span><input type="text" value={draft.title} onChange={e => upd({ title: e.target.value })} /></label>
            <label className="field span2"><span>Street address</span><input type="text" value={draft.street} placeholder="Needed for the map and commute" onChange={e => upd({ street: e.target.value })} /></label>
            <label className="field"><span>Neighborhood</span><input type="text" value={draft.hood} onChange={e => upd({ hood: e.target.value })} /></label>
            <label className="field"><span>City</span><input type="text" value={draft.city} onChange={e => upd({ city: e.target.value })} /></label>
            <label className="field"><span>Unit type</span>
              <select value={draft.room ? "room" : draft.beds === 0 ? "studio" : String(Math.min(draft.beds, 4))}
                onChange={e => { const v = e.target.value; upd(v === "room" ? { room: true, beds: 1 } : v === "studio" ? { room: false, beds: 0 } : { room: false, beds: +v }); }}>
                <option value="room">Private room</option><option value="studio">Studio</option>
                <option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4+ bedrooms</option>
              </select></label>
            {num("rent", draft.room ? "Rent for the room / month" : "Rent for the whole unit / month", "rent")}
            {num("util", "Utilities / month", "utilit")}
            {num("fees", "Other monthly fees", "fee")}
            {num("security", "Security deposit", "security")}
            <label className="field check"><input type="checkbox" checked={draft.last} onChange={e => upd({ last: e.target.checked })} /><span>Last month due at signing</span></label>
            {num("broker", "Broker fee", "broker")}
            {num("app", "Application fee", "application")}
            {num("holding", "Holding deposit", "holding")}
            <label className="field"><span>Available from</span><input type="date" value={draft.avail} onChange={e => upd({ avail: e.target.value })} /></label>
            <label className="field"><span>Lease</span><input type="text" value={draft.lease} onChange={e => upd({ lease: e.target.value })} /></label>
            <label className="field"><span>Found on</span><input type="text" value={draft.source} onChange={e => upd({ source: e.target.value })} /></label>
          </div>
          {!!draft.questions?.length && <div className="tip"><strong>Ask before you pay</strong><ul className="rec-list">{draft.questions.map(q => <li key={q}>{q}</li>)}</ul></div>}
          {err && <div className="flag" role="alert">{err}</div>}
          <div className="actions">
            <button className="btn primary" disabled={busy} onClick={save}>{busy ? "Locating address…" : "Save to tracker"}</button>
            <button className="btn" onClick={() => setDraft(null)} disabled={busy}>Back</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
