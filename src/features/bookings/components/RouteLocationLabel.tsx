import { useEffect, useMemo, useState } from "react";
import { parseLatLng } from "@/features/bookings/utils/helpers";
import { reverseGeocodeLngLat } from "@/utils/geofenceEngine";
import { loadGoogleMapsScript } from "@/shared/components/ui/GoogleAddressInput";

const COORDS_PATTERN = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\./;

export const looksLikeCoordinateLabel = (text?: string | null): boolean => {
  const s = String(text || "").trim();
  if (!s) return false;
  return COORDS_PATTERN.test(s) || /^-?\d{1,3}\.\d+$/.test(s);
};

interface RouteLocationLabelProps {
  locationRaw?: unknown;
  displayFallback?: string;
  className?: string;
}

export const RouteLocationLabel = ({
  locationRaw,
  displayFallback = "",
  className = "",
}: RouteLocationLabelProps) => {
  const parsed = useMemo(() => parseLatLng(locationRaw), [locationRaw]);
  const fallback = displayFallback?.trim() || "";

  const [text, setText] = useState(() => {
    if (fallback && !looksLikeCoordinateLabel(fallback)) return fallback;
    if (parsed) return "Loading…";
    return fallback || "—";
  });

  useEffect(() => {
    if (fallback && !looksLikeCoordinateLabel(fallback)) {
      setText(fallback);
      return;
    }
    if (!parsed) {
      setText(fallback || "—");
      return;
    }

    let cancelled = false;
    setText("Loading…");

    void (async () => {
      if (import.meta.env.VITE_GOOGLE_MAPS) {
        try {
          await loadGoogleMapsScript();
        } catch {
          /* Nominatim still runs */
        }
      }
      const addr = await reverseGeocodeLngLat(parsed.lng, parsed.lat);
      if (cancelled) return;
      setText(addr || fallback || `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [parsed?.lat, parsed?.lng, fallback]);

  const widthClass = /\bmax-w-/.test(className) ? "" : "max-w-[120px]";

  return (
    <span
      className={`text-xs font-semibold text-ink truncate block ${widthClass} ${className}`}
      title={text}
    >
      {text}
    </span>
  );
};
