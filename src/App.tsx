import { useEffect, useRef, useState } from "react";
import { AuthDialog } from "./components/AuthDialog";
import { PasteDialog } from "./components/PasteDialog";
import { SearchView } from "./components/SearchView";
import { TrackerView } from "./components/TrackerView";
import { signOut, useAuth } from "./hooks/useAuth";
import { geocodeApi } from "./lib/api";
import { hash } from "./lib/format";
import { findSchool, GENERIC_HOODS, SCHOOLS, type School } from "./lib/schools";
import { DEFAULT_FILTERS, type Filters, type Listing } from "./lib/types";
import { useTracker } from "./hooks/useTracker";

const illustrative = (v: string): School => ({ known: false, key: "u" + hash(v), name: v, label: v, short: v.slice(0, 25), city: "", st: "", idx: 0.85, hoods: GENERIC_HOODS, places: [], lat: 0, lng: 0, alias: [] });
const schoolMsgFor = (s: School) => ({
  err: false,
  text: (s.located ? `Found ${s.label}. ` : "") + `Showing sample listings around ${s.short}. Paste listings you’ve found to add real ones.`,
});

export function App() {
  const { user, enabled: authEnabled } = useAuth();
  const t = useTracker(user);
  const [view, setView] = useState(location.hash === "#tracker" ? "tracker" : "search");
  const [school, setSchool] = useState<School>(SCHOOLS[0]);
  const [schoolMsg, setSchoolMsg] = useState(schoolMsgFor(SCHOOLS[0]));
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState<false | string>(false);
  const pending = useRef("");

  useEffect(() => {
    const on = () => setView(location.hash === "#tracker" ? "tracker" : "search");
    addEventListener("hashchange", on); return () => removeEventListener("hashchange", on);
  }, []);
  useEffect(() => { if (user) setAuthOpen(false); }, [user]);

  const pickSchool = (s: School) => { setSchool(s); setSchoolMsg(schoolMsgFor(s)); };
  const onSchoolInput = (v: string) => { const s = findSchool(v, true); if (s && s.key !== school.key) pickSchool(s); };
  const onSchoolCommit = async (raw: string) => {
    const v = raw.trim();
    if (!v || v === school.label || v === school.name || v === pending.current) return;
    const s = findSchool(v, false);
    if (s) return pickSchool(s);
    if (v.length < 3) return;
    pending.current = v;
    setSchoolMsg({ err: false, text: `Finding “${v}”…` });
    try {
      const g = await geocodeApi(v);
      if (pending.current !== v) return;
      if (!g.found || g.lat == null || g.lng == null) { setSchoolMsg({ err: true, text: `Couldn’t find “${v}”. Try a school name or a full street address with the city.` }); return; }
      const name = g.name || v;
      pickSchool({ known: true, located: true, key: "g" + hash(name + g.lat + g.lng), name, city: g.city || "", st: g.st || "", short: name.slice(0, 25),
        label: g.city ? `${name}, ${g.city}` : name, lat: g.lat, lng: g.lng, idx: 0.85, hoods: g.hood ? [g.hood, ...GENERIC_HOODS.slice(1)] : GENERIC_HOODS, places: [], alias: [] });
    } catch {
      if (pending.current !== v) return;
      setSchool(illustrative(v));
      setSchoolMsg({ err: true, text: `Address lookup isn’t available right now, so “${v}” is shown on an illustrative map with sample listings.` });
    } finally { if (pending.current === v) pending.current = ""; }
  };

  const toggleSave = (l: Listing) => {
    if (t.tracker[l.id]) {
      if (l.origin === "pasted" && !confirm("Remove this pasted listing? It will be deleted.")) return;
      t.remove(l.id);
    } else t.save(l);
  };
  const openPaste = () => setPasteOpen(true);
  const count = Object.keys(t.tracker).length;

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <a className="brand" href="#search" aria-label="StudentNest AI home">
            <svg viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="7" fill="var(--blue)" /><path d="M6 13.5 13 7.5l7 6V19a1 1 0 0 1-1 1h-3.5v-4h-5v4H7a1 1 0 0 1-1-1z" fill="var(--blue-ink)" /></svg>
            StudentNest <small>Off-campus housing for students</small>
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#search" aria-current={view === "search" ? "page" : undefined}>Search</a>
            <a href="#tracker" aria-current={view === "tracker" ? "page" : undefined}>Tracker<span className="count">{count}</span></a>
          </nav>
          <div className="account">
            {authEnabled ? (user
              ? <><span className="avatar" title={user.email || ""}>{(user.email || "?")[0].toUpperCase()}</span><button className="link-btn" onClick={() => signOut()}>Sign out</button></>
              : <button className="btn" onClick={() => setAuthOpen("")}>Sign in</button>)
              : <span className="muted small" title="Add Supabase keys to enable sign-in">Saved on this device</span>}
          </div>
        </div>
      </header>

      <main>
        {t.syncError && <div className="flag" role="alert">{t.syncError}</div>}
        {view === "search" ? (
          <SearchView school={school} schoolMsg={schoolMsg} onSchoolInput={onSchoolInput} onSchoolCommit={onSchoolCommit} onPickSchool={pickSchool}
            filters={filters} setFilters={setFilters} tracker={t.tracker} onToggleSave={toggleSave} onPaste={openPaste} />
        ) : (
          <section>
            <div className="summary"><h1>Your tracker</h1>
              <p>Move each apartment along as you hear back, then compare them side by side.{!user && authEnabled ? " Sign in to keep this list on all your devices." : ""}</p></div>
            {t.loading ? <div className="empty"><p>Loading your saved apartments…</p></div> :
              <TrackerView tracker={t.tracker} prio={t.prio} mode={filters.mode} setStatus={t.setStatus} setNote={t.setNote} remove={t.remove} setPriority={t.setPriority} onPaste={openPaste} />}
          </section>
        )}
      </main>

      <PasteDialog open={pasteOpen} onClose={() => setPasteOpen(false)} school={school} needsSignIn={authEnabled && !user}
        onSignIn={() => setAuthOpen("Sign in to paste listings and keep them saved.")}
        onSave={l => { t.save(l); location.hash = "#tracker"; }} />
      {authEnabled && <AuthDialog open={authOpen !== false} onClose={() => setAuthOpen(false)} reason={authOpen || undefined} />}
    </>
  );
}
