// Real Google map when VITE_GOOGLE_MAPS_KEY is set; otherwise the prototype's schematic map.
import { APIProvider, AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { clamp, fmt, perPerson } from "../lib/format";
import { toXY } from "../lib/geo";
import type { School } from "../lib/schools";
import type { Listing } from "../lib/types";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || "DEMO_MAP_ID";

interface Props { school: School; list: Listing[]; all: Listing[]; highlighted: string | null; onPick: (id: string) => void }

export function MapView(props: Props) {
  const google = !!MAPS_KEY && props.school.known;
  return (
    <div className="mapbox">
      {google ? <GoogleMapView {...props} /> : <SchematicMap {...props} />}
      <div className="mapnote">
        {google
          ? "Green star is campus. Sample listings are generated for the demo; listings you paste are real."
          : "Rings show distance from campus. Sample listings are generated for the demo. Add a Google Maps key to see the real map."}
      </div>
    </div>
  );
}

function GoogleMapView({ school, list, highlighted, onPick }: Props) {
  return (
    <APIProvider apiKey={MAPS_KEY!}>
      <Map key={school.key} defaultCenter={{ lat: school.lat, lng: school.lng }} defaultZoom={13} mapId={MAP_ID}
        gestureHandling="cooperative" style={{ width: "100%", aspectRatio: "7 / 6" }} disableDefaultUI={false} streetViewControl={false}>
        <FitBounds school={school} list={list} />
        <AdvancedMarker position={{ lat: school.lat, lng: school.lng }} title={school.short} zIndex={1000}>
          <div className="gm-campus" aria-label={`${school.short} campus`}>★</div>
        </AdvancedMarker>
        {list.filter(l => l.lat != null).map(l => (
          <AdvancedMarker key={l.id} position={{ lat: l.lat!, lng: l.lng! }} title={l.title} onClick={() => onPick(l.id)} zIndex={highlighted === l.id ? 999 : 1}>
            <div className={"gm-pin" + (highlighted === l.id ? " hl" : "") + (l.flags.length ? " flagged" : "") + (l.origin === "pasted" ? " mine" : "")}>{fmt(perPerson(l))}</div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

function FitBounds({ school, list }: { school: School; list: Listing[] }) {
  const map = useMap();
  const core = useMapsLibrary("core");
  const sig = list.map(l => l.id).join(",");
  useEffect(() => {
    if (!map || !core) return;
    const b = new core.LatLngBounds({ lat: school.lat, lng: school.lng });
    list.forEach(l => l.lat != null && b.extend({ lat: l.lat, lng: l.lng! }));
    if (list.length) map.fitBounds(b, 40);
  }, [map, core, sig, school.key]);
  return null;
}

const SC = 40, CX = 350, CY = 300;
const px = (dx: number, dy: number) => [clamp(CX + dx * SC, 24, 676), clamp(CY - dy * SC, 40, 580)];

function SchematicMap({ school, list, all, highlighted, onPick }: Props) {
  const xy = (l: Listing) => toXY(school, { lat: l.lat!, lng: l.lng! });
  const streets = [];
  for (let x = 30; x < 700; x += 70) streets.push(<line key={"x" + x} className="street" x1={x} y1={0} x2={x + 30} y2={600} />);
  for (let y = 40; y < 600; y += 70) streets.push(<line key={"y" + y} className="street" x1={0} y1={y} x2={700} y2={y - 20} />);
  const hoods: Record<string, { x: number; y: number; n: number }> = {};
  all.filter(l => l.lat != null && l.hood).forEach(l => { const p = xy(l); const h = hoods[l.hood] ||= { x: 0, y: 0, n: 0 }; h.x += p.dx; h.y += p.dy; h.n++; });
  const ordered = list.filter(l => l.lat != null).sort((a, b) => Number(a.id === highlighted) - Number(b.id === highlighted));
  return (
    <svg viewBox="0 0 700 600" role="img" aria-label="Map of matching apartments around campus">
      <rect width="700" height="600" fill="var(--land)" />
      {streets}
      {[1, 2, 3, 4].map(mi => { const r = mi * 1.609 * SC; return <g key={mi}><circle className="ring" cx={CX} cy={CY} r={r} /><text className="ringlbl" x={CX + r * 0.71 + 4} y={CY - r * 0.71}>{mi} mi</text></g>; })}
      {Object.entries(hoods).map(([h, v]) => { const [x, y] = px(v.x / v.n, v.y / v.n); return <text key={h} className="hoodlbl" x={x} y={y + 26} textAnchor="middle">{h}</text>; })}
      <g aria-label={`${school.short} campus`}>
        <circle cx={CX} cy={CY} r={15} fill="var(--green)" />
        <path d={`M${CX} ${CY - 8} l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z`} fill="var(--paper)" />
        <text x={CX} y={CY + 32} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--green)">{school.short}</text>
      </g>
      {ordered.map(l => {
        const p = xy(l); const [x, y] = px(p.dx, p.dy);
        const t = fmt(perPerson(l)); const w = t.length * 8.6 + 14;
        return (
          <g key={l.id} className={"pin" + (l.flags.length ? " flagged" : "") + (highlighted === l.id ? " hl" : "")} tabIndex={0} role="button"
            aria-label={`${l.title}, ${t} per person`} onClick={() => onPick(l.id)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(l.id); } }}>
            <path d={`M${x - 6} ${y - 10} L${x} ${y} L${x + 6} ${y - 10} Z`} />
            <rect x={x - w / 2} y={y - 36} width={w} height={26} rx={13} />
            <text x={x} y={y - 18} textAnchor="middle">{t}</text>
          </g>
        );
      })}
    </svg>
  );
}
