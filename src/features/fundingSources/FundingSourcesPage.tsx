import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { Badge, Button } from "@/shared/components/ui";
import { ROUTES } from "@/constants/routes";
import { useGetCountiesQuery, type ICounty } from "@/redux/api/coverageApi";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";

/** County.contract `name` is the Funding Source name from setup. */
const countyTitle = (county: ICounty) =>
  county.name?.trim() || "Untitled county";

const fenceCount = (county: ICounty) =>
  Array.isArray(county.geofences)
    ? county.geofences.length
    : county.coversAreasGeoJSON
      ? 1
      : 0;

export default function FundingSourcesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const {
    data: countiesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCountiesQuery(undefined, { refetchOnMountOrArgChange: true });

  const counties = useMemo(() => countiesResponse?.data || [], [countiesResponse]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return counties;
    return counties.filter((county) => {
      const hay = [county.name, county.programName, county.organizationType, county.priceMethod]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [counties, search]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-ink-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading counties…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="text-urgent opacity-60" size={32} />
        <p className="text-sm text-ink-3">
          {apiErrorMessage(error, "Failed to load counties")}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="type-page-title">Funding Sources</h1>
          <p className="mt-1 text-sm text-ink-3">All counties / funding source contracts.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="h-10 rounded-lg px-4 text-sm"
          onClick={() => navigate(ROUTES.fundingSourceSetup)}
        >
          <Plus size={16} />
          Create contract
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search counties…"
          className="h-10 w-full pl-9 pr-3 text-sm font-medium text-ink border border-line-2 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-2 bg-white px-6 py-16 text-center">
          <Building2 className="mx-auto mb-3 text-ink-4" size={28} />
          <p className="text-sm font-medium text-ink">No counties yet</p>
          <p className="mt-1 text-xs text-ink-4">
            Create a Funding Source Contract to add the first county.
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={() => navigate(ROUTES.fundingSourceSetup)}
          >
            <Plus size={16} />
            Create contract
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((county) => (
            <CountyCard
              key={county._id}
              county={county}
              onEdit={() => navigate(ROUTES.fundingSourceEdit(county._id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CountyCard({
  county,
  onEdit,
}: {
  county: ICounty;
  onEdit: () => void;
}) {
  const active = county.isActive !== false;
  const fences = fenceCount(county);

  return (
    <article className="rounded-2xl border border-line-2 bg-white px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink truncate">{countyTitle(county)}</h2>
            <Badge variant={active ? "primary-light" : "neutral"}>
              {active ? "Active" : "Inactive"}
            </Badge>
            {county.priceMethod ? (
              <Badge variant="bg">{String(county.priceMethod).replace(/_/g, " ")}</Badge>
            ) : null}
          </div>
          {county.programName && county.programName !== countyTitle(county) ? (
            <p className="mt-1 text-sm text-ink-3">{county.programName}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-ink-4">
            <MapPin size={14} />
            {fences} geofence{fences === 1 ? "" : "s"}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onEdit}
          >
            <Pencil size={14} />
            Edit
          </Button>
        </div>
      </div>
    </article>
  );
}
