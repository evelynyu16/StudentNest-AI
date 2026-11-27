import { useEffect, useMemo, useState } from "react";
import { useCommutes } from "../hooks/useCommutes";
import { daysApart, fmt, perPerson } from "../lib/format";
import { kmBetween } from "../lib/geo";
import { sampleListings } from "../lib/sample";
import { SAMPLE_KEYS, SCHOOLS, type School } from "../lib/schools";
import { DEFAULT_FILTERS, type Filters, type Listing, type Mode, type Tracker } from "../lib/types";
import { DatePicker } from "./DatePicker";
import { ListingCard } from "./ListingCard";
import { MapView } from "./MapView";

interface Props {
  school: School; schoolMsg: { text: string; err: boolean }; onSchoolInput: (v: string) => void; onSchoolCommit: (v: string) => void;
  onPickSchool: (s: School) => void;
  filters: Filters; setFilters: (f: Filters) => void;
  tracker: Tracker; onToggleSave: (l: Listing) => void; onPaste: () => void;
}

export function SearchView({ school, schoolMsg, onSchoolInput, onSchoolCommit, onPickSchool, filters: f, setFilters, tracker, onToggleSave, onPaste }: Props) {
  const [query, setQuery] = useState(school.known ? school.label : school.name);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hl, setHl] = useState<string | null>(null);
  useEffect(() => { setQuery(school.known ? school.label : school.name); setOpen({}); setHl(null); }, [school.key, school.label]);

  const set = (p: Partial<Filters>) => setFilters({ ...f, ...p });
  const samples = useMemo(() => sampleListings(school), [school.key, school.label]);
  // The student's own pasted listings near this school join the results.
  const mine = useMemo(() => Object.values(tracker).map(t => t.listing)
    .filter(l => l.origin === "pasted" && kmBetween(l.anchor, school) < 25), [tracker, school]);
  const all = useMemo(() => [...mine, ...samples], [mine, samples]);
  const commute = useCommutes(all, f.mode);

  const list = useMemo(() => {
    const res = all.filter(l => {
      if (perPerson(l) > f.budget) return false;
      const c = commute(l);
      if (c && c.min > f.maxCommute) return false;
      if (f.group !== "any") {
        const g = f.group;
        const ok = g === "room" ? l.room : g === "studio" ? (!l.room && l.beds === 0) : g === "4" ? (!l.room && l.beds >= 4) : (!l.room && l.beds === +g);
        if (!ok) return false;
      }
      if (f.movein && l.avail && Math.abs(daysApart(l.avail, f.movein)) > 14) return false;
      return true;
    });
    const cm = (l: Listing) => commute(l)?.min ?? Infinity;
    return res.sort(f.sort === "cost" ? (a, b) => perPerson(a) - perPerson(b) : (a, b) => cm(a) - cm(b));
  }, [all, f, commute]);
  const hiddenMine = mine.filter(l => !list.includes(l)).length;

  const pick = (id: string) => {
    setHl(id);
    document.getElementById("card-" + id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  };

  return (
    <section>
      <form className="filters" onSubmit={e => e.preventDefault()} aria-label="Filters">
        <div className="field wide">
          <span>Where do you study? Type a school or any address</span>
          <div className="school-row">
            <input type="text" list="schoolList" autoComplete="off" placeholder="e.g. Northeastern, or 100 Main St, Portland, ME" aria-label="School or address"
              value={query} onFocus={e => e.target.select()}
              onChange={e => { setQuery(e.target.value); onSchoolInput(e.target.value); }}
              onBlur={() => onSchoolCommit(query)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSchoolCommit(query); } }} />
            <datalist id="schoolList">{SCHOOLS.map(s => <option key={s.key} value={s.label} />)}</datalist>
            <div className="samples"><span>Try:</span>
              {SAMPLE_KEYS.map(k => { const s = SCHOOLS.find(x => x.key === k)!; return <button type="button" key={k} className="sample" aria-pressed={school.key === k} onClick={() => onPickSchool(s)}>{s.short}</button>; })}
            </div>
          </div>
          <small className={"addr-msg" + (schoolMsg.err ? " err" : "")} aria-live="polite">{schoolMsg.text}</small>
        </div>

        <div className="field">
          <span>Getting to campus</span>
          <div className="seg" role="group" aria-label="Travel mode">
            {([["transit", "Transit"], ["walking", "Walk"], ["bicycling", "Bike"]] as [Mode, string][]).map(([m, t]) =>
              <button type="button" key={m} aria-pressed={f.mode === m} onClick={() => set({ mode: m })}>{t}</button>)}
          </div>
        </div>
        <label className="field">
          <span>Max commute: <output>{f.maxCommute} min</output></span>
          <input type="range" min={10} max={90} step={5} value={f.maxCommute} onChange={e => set({ maxCommute: +e.target.value })} />
        </label>
        <label className="field">
          <span>All-in budget per person: <output>{fmt(f.budget)}</output></span>
          <input type="range" min={600} max={4000} step={50} value={f.budget} onChange={e => set({ budget: +e.target.value })} />
        </label>
        <label className="field">
          <span>Unit type (one person per bedroom)</span>
          <select value={f.group} onChange={e => set({ group: e.target.value })}>
            <option value="any">Any</option>
            <option value="room">Private room in shared apartment</option>
            <option value="studio">Studio</option>
            <option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4+ bedrooms</option>
          </select>
        </label>
        <div className="field">
          <span>Move-in date (±2 weeks)</span>
          <DatePicker value={f.movein} onChange={v => set({ movein: v })} />
        </div>
        <div className="checks">
          <button type="button" className="btn primary" onClick={onPaste}>+ Paste a listing you found</button>
          <span className="muted small">Paste a post from Zillow, Craigslist, Facebook or a group chat and we’ll work out the true cost.</span>
          <span className="spacer" />
          <button type="button" className="link-btn" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
        </div>
      </form>

      <div className="summary">
        <h1>{list.length} {list.length === 1 ? "apartment matches" : "apartments match"} near {school.short}</h1>
        <p>Prices are all-in per person: rent plus estimated utilities and monthly fees.{hiddenMine ? ` ${hiddenMine} of your pasted listings ${hiddenMine === 1 ? "is" : "are"} hidden by the filters.` : ""}</p>
        <label className="sort">Sort by
          <select value={f.sort} onChange={e => set({ sort: e.target.value as Filters["sort"] })}>
            <option value="cost">Lowest all-in cost</option>
            <option value="commute">Shortest commute</option>
          </select>
        </label>
      </div>

      <div className="layout">
        <div className="list">
          {list.length ? list.map(l => (
            <ListingCard key={l.id} l={l} mode={f.mode} commute={commute(l)} saved={!!tracker[l.id]} open={!!open[l.id]} highlighted={hl === l.id}
              onSave={() => onToggleSave(l)} onToggle={() => setOpen(o => ({ ...o, [l.id]: !o[l.id] }))} onHover={() => setHl(l.id)} />
          )) : (
            <div className="empty"><p>No apartments match these filters. Try a higher budget or a longer commute.</p>
              <button className="btn primary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button></div>
          )}
        </div>
        <MapView school={school} list={list} all={all} highlighted={hl} onPick={pick} />
      </div>
    </section>
  );
}
