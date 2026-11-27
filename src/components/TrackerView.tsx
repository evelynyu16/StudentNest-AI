import { useMemo } from "react";
import { useCommutes } from "../hooks/useCommutes";
import { availText, fmt, MODE_TEXT, movePerPerson, perPerson, typeLabel } from "../lib/format";
import { factors, PRIO_LEVELS, scoreAll, type Factor, type Scored } from "../lib/score";
import { STATUSES, type Mode, type Priorities, type Status, type Tracker, type TrackerItem } from "../lib/types";

interface Props {
  tracker: Tracker; prio: Priorities; mode: Mode;
  setStatus: (id: string, s: Status) => void; setNote: (id: string, n: string) => void; remove: (id: string) => void;
  setPriority: (k: keyof Priorities, w: number) => void; onPaste: () => void;
}

export function TrackerView({ tracker, prio, mode, setStatus, setNote, remove, setPriority, onPaste }: Props) {
  const items = Object.values(tracker);
  const listings = useMemo(() => items.map(t => t.listing), [tracker]);
  const commute = useCommutes(listings, mode);
  const F = useMemo(() => factors(l => commute(l)?.min ?? null, MODE_TEXT[mode]), [commute, mode]);
  const scored = useMemo(() => scoreAll(items, prio, F), [tracker, prio, F]);

  if (!items.length) return (
    <div className="empty"><p>Nothing saved yet. Save apartments from Search, or paste a listing you found somewhere else.</p>
      <div className="row-gap"><a className="btn primary as-link" href="#search">Go to search</a><button className="btn" onClick={onPaste}>Paste a listing</button></div></div>
  );

  const scoreMap = Object.fromEntries(scored.map(s => [s.l.id, s]));
  const counts = STATUSES.map(s => items.filter(t => t.status === s).length);
  const label = (t: TrackerItem) => [t.listing.hood, `near ${t.listing.anchor.short}`].filter(Boolean).join(", ");
  type Row = [string, (t: TrackerItem) => number | string, (v: any) => React.ReactNode, ("min" | "max")?];
  const rows: Row[] = [
    ["Match for you", t => scoreMap[t.listing.id].score, (v: number) => <><span className="meter"><i style={{ width: v + "%" }} /></span>{v}%</>, "max"],
    ["Unit type", t => typeLabel(t.listing), v => v],
    ["All-in per person / month", t => perPerson(t.listing), (v: number) => fmt(v), "min"],
    ["Move-in cash per person", t => movePerPerson(t.listing), (v: number) => fmt(v), "min"],
    [`Commute to campus (${MODE_TEXT[mode]})`, t => commute(t.listing)?.min ?? Infinity, (v: number) => Number.isFinite(v) ? v + " min" : "Unknown", "min"],
    ["Broker fee (as listed)", t => t.listing.broker, (v: number) => v ? fmt(v) : "None listed"],
    ["Move-in date", t => availText(t.listing.avail), v => v],
    ["Scam warning signs", t => t.listing.flags.length, (v: number) => v ? <span className="bad">{v} found</span> : "None found"],
  ];

  return (
    <>
      <div className="stages">{STATUSES.map((s, i) => <div className="stage" key={s}><strong>{counts[i]}</strong><span>{s}</span></div>)}</div>
      <Recommendation items={items} scored={scored} prio={prio} F={F} setPriority={setPriority} />
      <div className="panel">
        <h2>Saved apartments<button className="link-btn panel-action" onClick={onPaste}>+ Paste a listing</button></h2>
        {items.map(t => (
          <div className="trow" key={t.listing.id}>
            <div className="name">
              <strong>{t.listing.title}{t.listing.origin === "pasted" && <span className="badge inline">Pasted</span>}{t.listing.flags.length > 0 && <span className="badge inline warn">Scam signs</span>}</strong>
              <span>{label(t)}. {fmt(perPerson(t.listing))} per person</span>
            </div>
            <select aria-label={`Status for ${t.listing.title}`} value={t.status} onChange={e => setStatus(t.listing.id, e.target.value as Status)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Add a note, e.g. tour Sat 2pm" value={t.note} aria-label={`Note for ${t.listing.title}`} onChange={e => setNote(t.listing.id, e.target.value)} />
            <button className="link-btn rm" onClick={() => {
              if (t.listing.origin !== "pasted" || confirm("Remove this pasted listing? It will be deleted from your account.")) remove(t.listing.id);
            }}>Remove</button>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Compare side by side<span className="panel-sub">Best value in each row is green</span></h2>
        <div className="scroll">
          <table>
            <thead><tr><th />{items.map(t => <th scope="col" key={t.listing.id}>{t.listing.title}<span>{label(t)}</span></th>)}</tr></thead>
            <tbody>
              {rows.map(([lbl, get, show, best]) => {
                const vals = items.map(get);
                const nums = vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
                const target = best === "min" ? Math.min(...nums) : best === "max" ? Math.max(...nums) : null;
                return <tr key={lbl}><th scope="row">{lbl}</th>{vals.map((v, i) => <td key={i} className={best && items.length > 1 && v === target ? "best" : ""}>{show(v)}</td>)}</tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Recommendation({ items, scored, prio, F, setPriority }: { items: TrackerItem[]; scored: Scored[]; prio: Priorities; F: Factor[]; setPriority: Props["setPriority"] }) {
  const ok = scored.filter(s => !s.flagged);
  const ws = F.reduce((s, f) => s + prio[f.k], 0);
  let main: React.ReactNode;
  if (items.length < 2) main = <p className="rec-empty">Save at least two apartments to get a recommendation.</p>;
  else if (!ws) main = <p className="rec-empty">Mark at least one factor as important to get a recommendation.</p>;
  else if (!ok.length) main = <p className="rec-empty">Every saved apartment shows rental-scam signs, so none is recommended.</p>;
  else {
    const b = ok[0], l = b.l;
    const reasons: string[] = [], trade: string[] = [];
    F.filter(f => prio[f.k] > 0).sort((x, y) => prio[y.k] - prio[x.k]).forEach(f => {
      const vals = ok.map(s => s.parts[f.k].v);
      const bestV = Math.min(...vals), mine = b.parts[f.k].v;
      if (mine === bestV) reasons.push(`${f.best} of your saved apartments: ${f.show(mine)}`);
      else { const who = ok.find(s => s.parts[f.k].v === bestV)!; trade.push(`${f.label}: ${f.show(mine)}, compared with ${f.show(bestV)} for ${who.l.title}`); }
    });
    if (!reasons.length) reasons.push("Best overall balance of the things you marked as important");
    const risks = ["Look up the address on Google Maps and open the original listing to confirm the details yourself."];
    if (l.broker) risks.push(`The listing states a broker fee of ${fmt(l.broker)}. Ask who hired the broker.`);
    l.questions?.slice(0, 2).forEach(q => risks.push(q));
    const next = ok.slice(1, 3).map(s => `${s.l.title} (${s.score}%)`).join(", ");
    main = <>
      <div className="rec-top">
        <div><div className="rec-kicker">Best match for you</div><h3>{l.title}</h3>
          <div className="where">{[l.hood, `near ${l.anchor.short}`].filter(Boolean).join(", ")}. {typeLabel(l)}, {fmt(perPerson(l))} per person / month</div></div>
        <div className="rec-score"><strong>{b.score}%</strong><span>match</span></div>
      </div>
      <p className="rec-h">Why</p><ul className="rec-list good">{reasons.map(r => <li key={r}>{r}</li>)}</ul>
      {trade.length > 0 && <><p className="rec-h">Trade-offs</p><ul className="rec-list">{trade.map(r => <li key={r}>{r}</li>)}</ul></>}
      <p className="rec-h">Check before you pay</p><ul className="rec-list warn">{risks.map(r => <li key={r}>{r}</li>)}</ul>
      {next && <p className="rec-next">Next best: {next}</p>}
    </>;
  }
  return (
    <div className="panel">
      <h2>Recommended for you<span className="panel-sub">Uses only your priorities and each listing’s cost and commute</span></h2>
      <div className="rec-body">
        <div>{main}</div>
        <div><h3>What matters to you</h3>
          <div className="prio">{F.map(f => (
            <div className="prio-row" key={f.k}><span>{f.label}</span>
              <div className="seg" role="group" aria-label={`How much ${f.label.toLowerCase()} matters`}>
                {PRIO_LEVELS.map((n, i) => <button type="button" key={n} aria-pressed={prio[f.k] === i} onClick={() => setPriority(f.k, i)}>{n}</button>)}
              </div></div>))}
          </div>
        </div>
      </div>
    </div>
  );
}
