import { useEffect, useState } from "react";
import { loadGoogleMapsScript } from "@/shared/components/ui/GoogleAddressInput";
import { reverseGeocodeLngLat } from "@/utils/geofenceEngine";
import { parseReportCoordinates } from "../utils/helpers";

interface ReportLocationFieldProps {
  label: string;
  value?: unknown;
}

export const ReportLocationField = ({ label, value }: ReportLocationFieldProps) => {
  const coordinates = parseReportCoordinates(value);
  const latitude = coordinates?.lat;
  const longitude = coordinates?.lng;
  const fallback = typeof value === "string" || typeof value === "number" ? String(value) : "—";
  const [locationLabel, setLocationLabel] = useState(fallback);

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setLocationLabel(fallback);
      return;
    }

    let cancelled = false;
    setLocationLabel("Resolving location…");
    void (async () => {
      if (import.meta.env.VITE_GOOGLE_MAPS) {
        try {
          await loadGoogleMapsScript();
        } catch {
          // Reverse geocoding can still use its fallback provider.
        }
      }
      const address = await reverseGeocodeLngLat(longitude, latitude);
      if (!cancelled) {
        setLocationLabel(address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, fallback]);

  if (!locationLabel || locationLabel === "—") return null;

  return (
    <div>
      <p className="text-xs text-ink-4">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-ink">{locationLabel}</p>
    </div>
  );
};
