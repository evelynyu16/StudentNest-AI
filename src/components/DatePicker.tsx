import { useEffect, useRef, useState } from "react";
import { availText, isoDate } from "../lib/format";

export function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const ref = useRef<HTMLDivElement>(null);
  const today = isoDate(new Date());

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, [open]);

  const toggle = () => {
    if (!open) { const b = value ? new Date(value + "T00:00:00") : new Date(new Date().getFullYear() + 1, 8, 1); setMonth(new Date(b.getFullYear(), b.getMonth(), 1)); }
    setOpen(!open);
  };
  const pick = (v: string) => { onChange(v); setOpen(false); };
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const ny = new Date().getFullYear() + 1;

  return (
    <div className="datepick" ref={ref}>
      <button type="button" className="date-btn" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>{value ? availText(value) : "Any date"}</button>
      {open && (
        <div className="cal" role="dialog" aria-label="Choose a move-in date">
          <div className="cal-head">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(y, m - 1, 1))}>‹</button>
            <strong>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(y, m + 1, 1))}>›</button>
          </div>
          <div className="cal-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <em key={d}>{d}</em>)}
            {Array.from({ length: first }, (_, i) => <span key={"b" + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const v = isoDate(new Date(y, m, i + 1));
              return <button type="button" key={v} disabled={v < today} aria-pressed={v === value} aria-label={availText(v)} onClick={() => pick(v)}>{i + 1}</button>;
            })}
          </div>
          <div className="cal-foot">
            <button type="button" onClick={() => pick(`${ny}-01-01`)}>Jan 1, {ny}</button>
            <button type="button" onClick={() => pick(`${ny}-09-01`)}>Sep 1, {ny}</button>
            <button type="button" onClick={() => pick("")}>Any date</button>
          </div>
        </div>
      )}
    </div>
  );
}
