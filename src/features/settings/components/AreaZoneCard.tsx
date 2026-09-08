import { MapPin, Pencil } from 'lucide-react';
import { resolveFenceLists, parsePolygon } from '@/utils/geofenceEngine';
import type { CountyConfig } from '@/hooks/usePricing';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';

/** Schematic outlines only — not the ZIP/city engine. */
const SCHEMATIC: { id: string; d: string; lx: number; ly: number }[] = [
  { id: 'county-hanover', d: 'M 92 10 L 232 16 L 224 76 L 100 70 Z', lx: 158, ly: 42 },
  { id: 'county-goochland', d: 'M 10 46 L 102 40 L 110 116 L 16 126 Z', lx: 56, ly: 84 },
  { id: 'county-henrico', d: 'M 118 70 L 250 66 L 244 146 L 132 140 Z', lx: 188, ly: 106 },
  { id: 'county-richmond', d: 'M 138 106 L 198 104 L 196 156 L 140 154 Z', lx: 168, ly: 132 },
  { id: 'county-powhatan', d: 'M 8 126 L 108 120 L 112 206 L 12 212 Z', lx: 58, ly: 166 },
  { id: 'county-chesterfield', d: 'M 108 146 L 238 150 L 230 226 L 90 220 Z', lx: 164, ly: 188 },
];

const gpsToPoints = (poly: [number, number][]) => {
  const lats = poly.map(p => p[0]);
  const lngs = poly.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.04;
  const w = 260;
  const h = 160;
  return poly
    .map(([lat, lng]) => {
      const x = ((lng - (minLng - pad)) / ((maxLng + pad) - (minLng - pad))) * w;
      const y = (1 - (lat - (minLat - pad)) / ((maxLat + pad) - (minLat - pad))) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

interface AreaZoneCardProps {
  areas: CountyConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: () => void;
  canEdit?: boolean;
}

export const AreaZoneCard = ({
  areas,
  selectedId,
  onSelect,
  onEdit,
  canEdit = true,
}: AreaZoneCardProps) => {
  const selected = areas.find(a => a.id === selectedId) || areas[0] || null;
  const fence = selected ? resolveFenceLists(selected) : { zipCodes: [] as string[], cities: [] as string[] };
  const drawn = selected ? parsePolygon(selected.polygon) : [];
  const knownIds = new Set(SCHEMATIC.map(z => z.id));

  return (
    <div className="rounded-xl border border-line-2 bg-white overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-line-2">
        <p className="text-sm font-semibold text-primary">Service zone</p>
        <p className="text-xs text-ink-4 mt-0.5">Draw the fence in Edit, or use ZIP and city.</p>
        <label className="text-xs font-semibold text-ink-4 uppercase mb-1.5 mt-3 block" htmlFor="area-zone-select">
          Zone
        </label>
        <select
          id="area-zone-select"
          className="h-10 box-border w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          value={selected?.id || ''}
          onChange={e => onSelect(e.target.value)}
          disabled={!areas.length}
        >
          {!areas.length && <option value="">No areas yet</option>}
          {areas.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative bg-[#E8EEF6] p-3">
        <div className="relative rounded-xl overflow-hidden border border-primary/15 bg-white/70">
          {drawn.length >= 3 ? (
            <svg viewBox="0 0 260 160" className="w-full h-[180px]" aria-label={`${selected?.name} outline`}>
              <polygon
                points={gpsToPoints(drawn)}
                className="fill-primary/25 stroke-primary"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 260 236" className="w-full h-[200px]" aria-label="Service zones">
              {SCHEMATIC.map(z => {
                const on = selected?.id === z.id;
                const exists = areas.some(a => a.id === z.id);
                if (!exists && !on) return null;
                return (
                  <g key={z.id}>
                    <path
                      d={z.d}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(z.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(z.id);
                        }
                      }}
                      className={`cursor-pointer stroke-[1.5] ${
                        on ? 'fill-primary/35 stroke-primary' : 'fill-white/80 stroke-line'
                      }`}
                    />
                    <text
                      x={z.lx}
                      y={z.ly}
                      textAnchor="middle"
                      className="pointer-events-none fill-ink-3"
                      fontSize="9"
                      fontWeight={on ? 700 : 500}
                    >
                      {areas.find(a => a.id === z.id)?.name.replace(/ County| City/, '') || ''}
                    </text>
                  </g>
                );
              })}
              {selected && !knownIds.has(selected.id) && (
                <g>
                  <rect x="40" y="70" width="180" height="80" rx="12" className="fill-primary/20 stroke-primary" />
                  <text x="130" y="116" textAnchor="middle" className="fill-primary" fontSize="12" fontWeight="700">
                    {selected.name}
                  </text>
                </g>
              )}
            </svg>
          )}

          {canEdit && selected && (
            <button
              type="button"
              onClick={onEdit}
              className={`absolute bottom-2 right-2 ${actionBtn} bg-white border border-line-2 text-ink shadow-sm flex items-center gap-1.5`}
            >
              <Pencil size={14} /> Edit zone
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex items-start gap-2 border-t border-line-2 bg-bg/40">
        <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-3">
          {selected
            ? [
                selected.name,
                drawn.length >= 3 ? 'drawn fence' : null,
                fence.zipCodes.length > 0 ? `${fence.zipCodes.length} ZIPs` : null,
                fence.cities.length > 0 ? `${fence.cities.length} cities` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Add an area to preview its zone.'}
        </p>
      </div>
    </div>
  );
};
