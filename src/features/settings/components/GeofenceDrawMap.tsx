import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Pencil, Check, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import 'leaflet/dist/leaflet.css';

const VA_CENTER: [number, number] = [37.43, -77.55];

const vertexIcon = divIcon({
  className: 'geofence-vertex',
  html: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function openRing(poly: [number, number][]): [number, number][] {
  if (poly.length >= 2) {
    const a = poly[0];
    const b = poly[poly.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) return poly.slice(0, -1);
  }
  return poly;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    const t2 = window.setTimeout(() => map.invalidateSize(), 300);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [map]);
  return null;
}

function FitFence({ positions, enabled }: { positions: [number, number][]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || positions.length < 3) return;
    map.fitBounds(positions, { padding: [24, 24], maxZoom: 12 });
  }, [map, positions, enabled]);
  return null;
}

function DrawClicks({
  enabled,
  onAdd,
  onFinish,
}: {
  enabled: boolean;
  onAdd: (pt: [number, number]) => void;
  onFinish: () => void;
}) {
  const map = useMap();
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
    dblclick(e) {
      if (!enabled) return;
      e.originalEvent.preventDefault();
      onFinish();
    },
  });
  useEffect(() => {
    const el = map.getContainer();
    el.style.cursor = enabled ? 'crosshair' : '';
    if (enabled) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
    return () => {
      el.style.cursor = '';
      map.doubleClickZoom.enable();
    };
  }, [enabled, map]);
  return null;
}

interface GeofenceDrawMapProps {
  polygon: [number, number][];
  onChange: (polygon: [number, number][]) => void;
}

export function GeofenceDrawMap({ polygon, onChange }: GeofenceDrawMapProps) {
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const vertices = useMemo(() => openRing(polygon), [polygon]);
  const canFinish = drawing && draft.length >= 3;
  const finishRef = useRef(() => {});

  const finish = () => {
    if (draft.length < 3) return;
    onChange(draft.map(([lat, lng]) => [lat, lng] as [number, number]));
    setDraft([]);
    setDrawing(false);
  };
  finishRef.current = finish;

  const startDraw = () => {
    setDraft([]);
    setDrawing(true);
  };

  const clear = () => {
    setDraft([]);
    setDrawing(false);
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="geofence-map rounded-xl overflow-hidden border border-line-2">
        <MapContainer
          center={vertices[0] || VA_CENTER}
          zoom={10}
          scrollWheelZoom
          className="h-52 w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSize />
          <FitFence positions={vertices} enabled={!drawing && vertices.length >= 3} />
          <DrawClicks
            enabled={drawing}
            onAdd={pt => setDraft(d => [...d, pt])}
            onFinish={() => finishRef.current()}
          />
          {!drawing && vertices.length >= 3 && (
            <Polygon
              positions={vertices}
              pathOptions={{ color: '#2969CD', weight: 2, fillColor: '#2969CD', fillOpacity: 0.25 }}
            />
          )}
          {drawing && draft.length >= 3 && (
            <Polygon
              positions={draft}
              pathOptions={{ color: '#2969CD', weight: 2, dashArray: '6 6', fillColor: '#2969CD', fillOpacity: 0.18 }}
            />
          )}
          {drawing && draft.length === 2 && (
            <Polyline positions={draft} pathOptions={{ color: '#2969CD', weight: 2, dashArray: '6 6' }} />
          )}
          {drawing &&
            draft.map((pt, i) => (
              <Marker key={`d-${i}`} position={pt} icon={vertexIcon} />
            ))}
          {!drawing &&
            vertices.map((pt, i) => (
              <Marker
                key={`v-${i}`}
                position={pt}
                icon={vertexIcon}
                draggable
                eventHandlers={{
                  dragend: e => {
                    const ll = (e.target as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
                    const next = vertices.map((p, idx) =>
                      idx === i ? ([ll.lat, ll.lng] as [number, number]) : p
                    );
                    onChange(next);
                  },
                }}
              />
            ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="h-10 rounded-xl px-3 text-sm" onClick={startDraw}>
          <Pencil size={14} /> Draw
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 rounded-xl px-3 text-sm"
          onClick={finish}
          disabled={!canFinish}
        >
          <Check size={14} /> Finish
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-3 text-sm"
          onClick={clear}
          disabled={!drawing && vertices.length === 0}
        >
          <Trash2 size={14} /> Clear
        </Button>
        {drawing && (
          <p className="text-xs text-ink-4">Click the map to add points, Finish to close the shape.</p>
        )}
      </div>
    </div>
  );
}
