import { makeId } from "./defaults";
import type { GeofenceEntry, GeofenceGeometry } from "./types";

type GeoJsonLike = {
  type?: string;
  name?: string;
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates?: unknown };
  coordinates?: unknown;
  features?: Array<GeoJsonLike | null | undefined>;
};

export type GeofenceSourceRef = {
  fileIndex: number;
  featureIndex: number;
};

const propName = (props?: Record<string, unknown>) => {
  if (!props || typeof props !== "object") return "";
  const raw = props.name ?? props.Locality ?? props.JURIS;
  return typeof raw === "string" ? raw.trim() : "";
};

const isPolygonish = (type?: string) => type === "Polygon" || type === "MultiPolygon";

const readGeometry = (
  feature: GeoJsonLike | null | undefined,
): GeofenceGeometry | null => {
  if (!feature || typeof feature !== "object") return null;
  const geometry = feature.type === "Feature" ? feature.geometry : feature;
  if (!geometry || typeof geometry !== "object") return null;
  if (!isPolygonish(geometry.type) || geometry.coordinates == null) return null;
  return {
    type: geometry.type as "Polygon" | "MultiPolygon",
    coordinates: geometry.coordinates,
  };
};

const listFeatures = (parsed: unknown): GeoJsonLike[] => {
  if (!parsed || typeof parsed !== "object") return [];
  const data = parsed as GeoJsonLike;
  if (data.type === "FeatureCollection") {
    return (Array.isArray(data.features) ? data.features : []).filter(
      (f): f is GeoJsonLike => Boolean(f && typeof f === "object"),
    );
  }
  if (data.type === "Feature" || isPolygonish(data.type)) return [data];
  return [];
};

/**
 * Lightweight parse for the UI list only — does not retain coordinates
 * (large county GeoJSON files are multi-MB and will freeze React state).
 */
export const parseGeoJsonToGeofenceMeta = (
  parsed: unknown,
  fileName: string,
  fileIndex: number,
  startIndex = 1,
): { rows: GeofenceEntry[]; sources: Array<{ id: string; source: GeofenceSourceRef }> } => {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid GeoJSON");
  const data = parsed as GeoJsonLike;
  if (!data.type) throw new Error("Invalid GeoJSON");

  const features = listFeatures(parsed);
  const rows: GeofenceEntry[] = [];
  const sources: Array<{ id: string; source: GeofenceSourceRef }> = [];

  features.forEach((feature, featureIndex) => {
    const geometry = readGeometry(feature);
    if (!geometry) return;
    const id = makeId();
    rows.push({
      id,
      name:
        propName(feature.properties) ||
        (typeof feature.name === "string" ? feature.name.trim() : "") ||
        `Geofence ${startIndex + rows.length}`,
      geometryType: geometry.type,
      isActive: true,
      sourceFileName: fileName,
    });
    sources.push({ id, source: { fileIndex, featureIndex } });
  });

  if (!rows.length) throw new Error("No Polygon/MultiPolygon features found");
  return { rows, sources };
};

/** Re-read uploaded files on submit and build API geofences with current UI names/status. */
export const buildGeofencesFromFiles = async (
  files: File[],
  draftRows: GeofenceEntry[],
  sourceById: Map<string, GeofenceSourceRef>,
): Promise<Array<{ name: string; geometry: GeofenceGeometry; isActive: boolean }>> => {
  const parsedFiles: unknown[] = [];
  for (const file of files) {
    parsedFiles.push(JSON.parse(await file.text()));
  }

  const out: Array<{ name: string; geometry: GeofenceGeometry; isActive: boolean }> = [];
  for (const row of draftRows) {
    const source = sourceById.get(row.id);
    if (!source) continue;
    const parsed = parsedFiles[source.fileIndex];
    const features = listFeatures(parsed);
    const feature = features[source.featureIndex];
    const geometry = readGeometry(feature);
    if (!geometry) continue;
    out.push({
      name: row.name.trim() || "Geofence",
      geometry,
      isActive: row.isActive !== false,
    });
  }
  return out;
};
