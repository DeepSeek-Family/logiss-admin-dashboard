import { ExternalLink, Navigation } from "lucide-react";
import { buildGoogleMapsDirectionsUrl } from "@/utils/googleMaps";

interface GoogleMapsRouteButtonProps {
  pickup: unknown;
  dropoff: unknown;
  stops?: unknown[];
  label?: string;
}

export const GoogleMapsRouteButton = ({
  pickup,
  dropoff,
  stops = [],
  label = "Open map",
}: GoogleMapsRouteButtonProps) => {
  const directionsUrl = buildGoogleMapsDirectionsUrl(pickup, dropoff, stops);

  if (!directionsUrl) {
    return (
      <button
        type="button"
        disabled
        title="Pickup and drop-off coordinates are unavailable"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-bg px-2.5 py-1.5 text-xs font-semibold text-ink-4 opacity-60"
      >
        <Navigation size={13} /> Map unavailable
      </button>
    );
  }

  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open pickup-to-drop-off directions in Google Maps"
      aria-label="Open pickup-to-drop-off directions in Google Maps"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
    >
      <Navigation size={13} className="text-indigo-600" />
      {label}
      <ExternalLink size={11} className="opacity-60" />
    </a>
  );
};
