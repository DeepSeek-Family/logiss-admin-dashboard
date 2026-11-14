import { useRef, useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { makeId } from "./defaults";
import { ensureWgs84Geometry } from "./reprojectGeoJson";

export type GeofenceFileChip = {
  id: string;
  name: string;
  sizeBytes: number;
};

type Props = {
  /** Called with the current File list (parent should keep this in a ref — avoid page-level setState). */
  onFilesChange: (files: File[]) => void;
  inputClassName?: string;
};

type GeoJsonDoc = {
  type?: string;
  name?: string;
  features?: unknown[];
  geometry?: { type?: string; coordinates?: unknown };
  coordinates?: unknown;
  properties?: Record<string, unknown>;
  crs?: { properties?: { name?: string } };
};

const accept = ".geojson,.json,application/geo+json,application/json";

const isGeoJsonName = (name: string) => {
  const lower = name.toLowerCase();
  return lower.endsWith(".json") || lower.endsWith(".geojson");
};

const isPolygonish = (type?: string) => type === "Polygon" || type === "MultiPolygon";

const collectFeatures = (parsed: GeoJsonDoc, fileName: string): GeoJsonDoc[] => {
  if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
    return parsed.features.filter((f): f is GeoJsonDoc => Boolean(f && typeof f === "object"));
  }
  if (parsed.type === "Feature") return [parsed];
  if (isPolygonish(parsed.type)) {
    return [
      {
        type: "Feature",
        properties: { name: fileName.replace(/\.(geo)?json$/i, "") },
        geometry: parsed as { type?: string; coordinates?: unknown },
      },
    ];
  }
  throw new Error(`${fileName}: not a GeoJSON Feature / FeatureCollection`);
};

/**
 * Merge uploads into one WGS84 FeatureCollection for POST /counties `file`.
 * Projected CRS (e.g. EPSG:2284 Chesterfield) is auto-reprojected to lon/lat.
 */
export const mergeGeoJsonFiles = async (files: File[]): Promise<File> => {
  if (!files.length) throw new Error("Upload at least one GeoJSON file");

  const features: GeoJsonDoc[] = [];
  const reprojected: string[] = [];

  for (const file of files) {
    const parsed = JSON.parse(await file.text()) as GeoJsonDoc;
    const crsName = parsed.crs?.properties?.name;
    const rows = collectFeatures(parsed, file.name);

    for (const feature of rows) {
      const geometry =
        feature.type === "Feature"
          ? feature.geometry
          : (feature as { type?: string; coordinates?: unknown });
      if (!geometry || !isPolygonish(geometry.type)) continue;

      const { geometry: wgs84, reprojectedFrom } = ensureWgs84Geometry(geometry, crsName);
      if (reprojectedFrom) reprojected.push(reprojectedFrom);

      features.push({
        type: "Feature",
        properties: {
          ...(feature.properties ?? {}),
          ...(feature.type !== "Feature"
            ? { name: file.name.replace(/\.(geo)?json$/i, "") }
            : {}),
        },
        geometry: wgs84,
      });
    }
  }

  if (!features.length) {
    throw new Error("No Polygon/MultiPolygon features found in the uploaded GeoJSON");
  }

  // Quiet — do not toast here (looks like a second error next to API failures).
  void reprojected;

  const body = JSON.stringify({
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features,
  });

  return new File([body], files.length === 1 ? files[0].name : "boundaries-merged.geojson", {
    type: "application/geo+json",
  });
};

/**
 * Self-contained upload UI. Local chip state only — does not force the parent
 * form to rebuild (that was blanking the page after picking multi-MB GeoJSON).
 */
export const GeofenceUploadField = ({ onFilesChange }: Props) => {
  const filesRef = useRef<File[]>([]);
  const [chips, setChips] = useState<GeofenceFileChip[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  const sync = (nextFiles: File[], nextChips: GeofenceFileChip[]) => {
    filesRef.current = nextFiles;
    onFilesChange(nextFiles);
    setChips(nextChips);
  };

  const restoreScroll = () => {
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const onPick = (list: FileList | null) => {
    if (!list?.length) return;

    const nextFiles = [...filesRef.current];
    const nextChips = [...chips];
    let added = 0;

    for (const file of Array.from(list)) {
      if (!isGeoJsonName(file.name)) {
        toast.error(`${file.name}: only .json / .geojson allowed`);
        continue;
      }
      if (nextFiles.some((f) => f.name === file.name && f.size === file.size)) continue;
      nextFiles.push(file);
      nextChips.push({ id: makeId(), name: file.name, sizeBytes: file.size });
      added += 1;
    }

    if (!added) {
      restoreScroll();
      return;
    }

    sync(nextFiles, nextChips);
    const totalMb = (nextFiles.reduce((n, f) => n + f.size, 0) / (1024 * 1024)).toFixed(1);
    toast.success(
      `${added} file${added === 1 ? "" : "s"} added · ${nextFiles.length} total (${totalMb} MB)`,
    );
    restoreScroll();
  };

  const removeAt = (id: string) => {
    const idx = chips.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const nextFiles = filesRef.current.filter((_, i) => i !== idx);
    const nextChips = chips.filter((c) => c.id !== id);
    sync(nextFiles, nextChips);
  };

  const clearAll = () => sync([], []);

  return (
    <div ref={sectionRef} className="space-y-4">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-bg/40 p-5 text-center">
        <FileUp className="text-primary" size={28} />
        <span className="mt-2 text-sm font-semibold">Upload GeoJSON boundaries</span>
        <span className="mt-1 max-w-md text-xs text-ink-4">
          Multiple files OK · merged on save · EPSG:2284 (Chesterfield) auto-converts to WGS84
        </span>
        <input
          className="sr-only"
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {chips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {chips.length} file{chips.length === 1 ? "" : "s"} ready
            </p>
            <Button size="sm" variant="ghost" className="text-urgent" onClick={clearAll}>
              <Trash2 size={14} /> Clear all
            </Button>
          </div>
          {chips.map((chip) => (
            <div
              key={chip.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{chip.name}</p>
                <p className="text-xs text-ink-4">
                  {(chip.sizeBytes / (1024 * 1024)).toFixed(1)} MB · WGS84 on save
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${chip.name}`}
                className="shrink-0 p-2 text-urgent"
                onClick={() => removeAt(chip.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
