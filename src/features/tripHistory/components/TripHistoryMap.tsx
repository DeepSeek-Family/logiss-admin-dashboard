import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Plus, Minus, MapPin, Navigation, Truck, ExternalLink, X, MousePointerClick, Clock, Loader2, RotateCcw } from 'lucide-react';
import { Card, Avatar, TripStatusBadge, loadGoogleMapsScript } from '@/shared/components/ui';
import { formatTime, formatShortDate, money } from '@/utils/helpers';
import { parseLatLng, extractBookingStopsCoords } from '@/features/bookings/utils/helpers';

interface TripHistoryMapProps {
  trips: any[];
  drivers: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenDetails?: (id: string) => void;
  onClose?: () => void;
  /** Plot every passed trip (used on the dispatch/bookings screen). Default plots history only. */
  plotAll?: boolean;
  title?: string;
}

export const TripHistoryMap: React.FC<TripHistoryMapProps> = ({
  trips,
  drivers,
  selectedId,
  onSelect,
  onOpenDetails,
  onClose,
  plotAll = false,
  title = 'Trip Map',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const driverById = useMemo(() => {
    const m: Record<string, any> = {};
    (drivers || []).forEach((d) => {
      m[String(d.id)] = d;
    });
    return m;
  }, [drivers]);

  const historyTrips = useMemo(
    () => (trips || []).filter((t: any) => t?.scheduledTime && (plotAll || t.status !== 'pending_review' || t.driverId)),
    [trips, plotAll]
  );

  const selected = selectedId ? historyTrips.find((t: any) => t.id === selectedId) : null;
  const selDriver = selected?.driverId ? driverById[String(selected.driverId)] : null;

  const vehicleStatusLabel = selected
    ? ['in_trip', 'en_route'].includes(selected.status)
      ? 'En route to drop-off'
      : selected.status === 'arrived'
      ? 'Arrived at drop-off'
      : selected.status === 'completed'
      ? 'Trip completed'
      : selDriver
      ? 'Staged at pickup'
      : 'Awaiting assignment'
    : '';

  useEffect(() => {
    let active = true;
    loadGoogleMapsScript()
      .then(() => {
        if (!active) return;
        if ((window as any).google?.maps) {
          setScriptLoaded(true);
        } else {
          setLoadFailed(true);
        }
      })
      .catch((err) => {
        console.warn('Google Maps script load error:', err);
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Initialize Map Instance once script is loaded
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || mapInstanceRef.current) return;

    const google = (window as any).google;
    const defaultCenter = { lat: 37.5407, lng: -77.4360 };

    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: false,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapInstanceRef.current = map;
  }, [scriptLoaded]);

  // Update Markers, Polyline, and Bounds when trips or selectedId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !scriptLoaded) return;
    const map = mapInstanceRef.current;
    const google = (window as any).google;

    // Clear existing markers & polylines
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let validCount = 0;

    historyTrips.forEach((t: any) => {
      const pCoord = parseLatLng(t.pickupLocationRaw || t.pickupLocation || t.pickup);
      const dCoord = parseLatLng(t.dropOffLocationRaw || t.dropOffLocation || t.dropoff);
      const stopsCoords = extractBookingStopsCoords(t);

      const isSel = t.id === selectedId;

      if (isSel) {
        const path: any[] = [];
        if (pCoord) {
          path.push(pCoord);
          bounds.extend(pCoord);
          validCount++;

          const pMarker = new google.maps.Marker({
            position: pCoord,
            map,
            title: `Pickup: ${t.pickup || 'Pickup Location'}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#2969CD',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2.5,
            },
          });
          markersRef.current.push(pMarker);
        }

        stopsCoords.forEach((sCoord, idx) => {
          path.push(sCoord);
          bounds.extend(sCoord);
          validCount++;

          const sMarker = new google.maps.Marker({
            position: sCoord,
            map,
            title: `Stop ${idx + 1}: ${t.stops?.[idx] || 'Drop Stop'}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#F59E0B',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2.5,
            },
          });
          markersRef.current.push(sMarker);
        });

        if (dCoord) {
          path.push(dCoord);
          bounds.extend(dCoord);
          validCount++;

          const dMarker = new google.maps.Marker({
            position: dCoord,
            map,
            title: `Drop-off: ${t.dropoff || 'Drop-off Location'}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2.5,
            },
          });
          markersRef.current.push(dMarker);
        }

        if (path.length > 1) {
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#2969CD',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
          });
          polylinesRef.current.push(polyline);
        }
      } else {
        // Plot non-selected trips
        const mainCoord = pCoord || dCoord;
        if (mainCoord) {
          bounds.extend(mainCoord);
          validCount++;

          const marker = new google.maps.Marker({
            position: mainCoord,
            map,
            title: `${t.rider?.name || 'Trip'} · ${formatTime(t.scheduledTime)}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: ['completed'].includes(t.status) ? '#10B981' : ['in_trip', 'en_route'].includes(t.status) ? '#EF4444' : '#2969CD',
              fillOpacity: 0.75,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.5,
            },
          });

          marker.addListener('click', () => {
            onSelect(t.id);
            if (infoWindowRef.current) {
              const stopsText = stopsCoords.length ? `<div style="font-size:11px; margin-top:2px;"><b>Stops:</b> ${stopsCoords.length} stop(s)</div>` : '';
              infoWindowRef.current.setContent(`
                <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
                  <div style="font-weight: 600; font-size: 13px; color: #111;">${t.rider?.name || 'Rider'}</div>
                  <div style="font-size: 11px; color: #666; margin-top: 2px;">#${t.id} · ${formatTime(t.scheduledTime)}</div>
                  <div style="font-size: 11px; margin-top: 6px;"><b>Pickup:</b> ${t.pickup || 'N/A'}</div>
                  ${stopsText}
                  <div style="font-size: 11px; margin-top: 2px;"><b>Drop-off:</b> ${t.dropoff || 'N/A'}</div>
                </div>
              `);
              infoWindowRef.current.open(map, marker);
            }
          });

          markersRef.current.push(marker);
        }
      }
    });

    if (validCount > 0) {
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      if (validCount === 1) {
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom() > 15) map.setZoom(14);
        });
        return () => google.maps.event.removeListener(listener);
      }
    }
  }, [scriptLoaded, historyTrips, selectedId, onSelect]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) - 1);
    }
  };

  const handleReset = () => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    historyTrips.forEach((t: any) => {
      const p = parseLatLng(t.pickupLocationRaw || t.pickupLocation || t.pickup);
      const d = parseLatLng(t.dropOffLocationRaw || t.dropOffLocation || t.dropoff);
      if (p) { bounds.extend(p); count++; }
      if (d) { bounds.extend(d); count++; }
    });
    if (count > 0) {
      mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  };

  return (
    <div className="w-full xl:w-[360px] shrink-0 xl:sticky xl:top-4 flex flex-col gap-4 xl:h-[calc(100vh-9rem)]">
      {/* Map Card */}
      <Card className="overflow-hidden p-0 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-2">
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-primary" />
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-4 bg-bg px-2 py-0.5 rounded-full border border-line-2">
              {historyTrips.length} trips
            </span>
            {onClose && (
              <button
                onClick={onClose}
                title="Hide map"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-4 hover:text-ink hover:bg-bg border border-line-2 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden h-[360px] bg-bg">
          <div ref={mapRef} className="w-full h-full" />

          {!scriptLoaded && !loadFailed && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs font-medium text-ink-4">Loading Google Maps...</p>
            </div>
          )}

          {loadFailed && (
            <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center p-4 text-center z-10">
              <MapPin size={24} className="text-urgent opacity-40 mb-2" />
              <p className="text-xs font-semibold text-ink">Google Maps Unavailable</p>
              <p className="text-[11px] text-ink-4 mt-0.5">Check VITE_GOOGLE_MAPS API key in .env</p>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleReset}
              title="Reset View"
              className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </Card>

      {/* Detail card — fills the remaining space below the map */}
      <Card className="flex-1 min-h-0 overflow-y-auto p-0">
        {selected ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar initials={selected?.rider?.initials || '?'} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{selected?.rider?.name || 'Unknown'}</p>
                  <p className="text-xs text-ink-4">
                    #{selected.id} · {formatShortDate(selected.scheduledTime)} · {formatTime(selected.scheduledTime)}
                  </p>
                </div>
              </div>
              <button onClick={() => onSelect(null)} className="p-1.5 text-ink-4 hover:text-ink rounded-lg hover:bg-bg shrink-0">
                <X size={15} />
              </button>
            </div>

            {/* Vehicle status */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Truck size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{selDriver ? selDriver.name : 'Unassigned'}</p>
                <p className="text-xs text-ink-4">
                  {selDriver ? `${selDriver.vehicle?.type || ''} · ${selDriver.vehicle?.plate || ''}` : 'No vehicle assigned'}
                </p>
              </div>
              <span className="ml-auto text-xs font-semibold text-primary bg-white px-2 py-1 rounded-full border border-primary/20 whitespace-nowrap">
                {vehicleStatusLabel}
              </span>
            </div>

            {/* Route */}
            <div className="relative pl-1 space-y-3 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-white shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-ink-4">Pickup</p>
                  <p className="text-xs font-medium text-ink leading-snug">{selected.pickup || '—'}</p>
                </div>
              </div>
              {selected.stop && (
                <div className="flex items-start gap-2.5">
                  <div className="w-3 h-3 rounded-full border-2 border-warning bg-white shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-4">Stop</p>
                    <p className="text-xs font-medium text-ink leading-snug">{selected.stop}</p>
                  </div>
                </div>
              )}
              {Array.isArray(selected.stops) &&
                selected.stops.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-3 h-3 rounded-full border-2 border-warning bg-white shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-ink-4">Stop {i + 1}</p>
                      <p className="text-xs font-medium text-ink leading-snug">{s}</p>
                    </div>
                  </div>
                ))}
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="text-urgent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-ink-4">Drop-off</p>
                  <p className="text-xs font-medium text-ink leading-snug">{selected.dropoff || '—'}</p>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-xs text-ink-4">Pickup time</p>
                <p className="text-xs font-semibold text-ink flex items-center gap-1">
                  <Clock size={10} className="text-ink-4" />
                  {selected.requestedPickup || formatTime(selected.scheduledTime)}
                </p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-xs text-ink-4">Distance</p>
                <p className="text-xs font-semibold text-ink">{selected.distance || (selected.miles ? `${selected.miles} mi` : '—')}</p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-xs text-ink-4">Trip cost</p>
                <p className="text-xs font-semibold text-ink">{money(selected.cost || 0)}</p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-xs text-ink-4">Reason</p>
                <p className="text-xs font-semibold text-ink truncate">{selected.reason || '—'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line-2">
              <TripStatusBadge status={selected.status} className="text-xs" />
              {onOpenDetails && (
                <button
                  onClick={() => onOpenDetails(selected.id)}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open full details <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-3">
              <MousePointerClick size={20} className="text-ink-4" />
            </div>
            <p className="text-sm font-semibold text-ink">No trip selected</p>
            <p className="text-xs text-ink-4 mt-1 max-w-[220px]">
              Click any trip in the table to locate its vehicle on the map and see its details here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

