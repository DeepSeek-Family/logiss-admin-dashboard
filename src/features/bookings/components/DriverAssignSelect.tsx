import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Avatar } from "@/shared/components/ui";
import { useGetDriversQuery } from "@/redux/api/driversApi";
import {
  driverDutyStatusLabel,
  isDriverOnDuty,
  mapApiDriver,
} from "@/features/drivers/utils/helpers";
import { suggestDrivers } from "../utils/suggestDriver";

const APPROVE_BEFORE_DRIVER_TOOLTIP = "Please approve this booking first";
const MENU_WIDTH = 280;
const MENU_MAX_HEIGHT = 320;

interface DriverAssignSelectProps {
  trip?: any;
  drivers: any[];
  /** All trips — used to read each candidate driver's same-day route/workload. */
  allTrips: any[];
  onAssign: (driverId: string) => void;
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  allowUnassign?: boolean;
  placeholder?: string;
}

const matchesDriverSearch = (driver: any, query: string): boolean => {
  if (!query) return true;
  const hay = [driver?.name, driver?.id, driver?._id, driver?.phone, driver?.contact, driver?.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
};

/**
 * Searchable driver picker with route-aware ranking + force-assign.
 * Options show driver name and duty status (`isOnDuty` → Ready for duty / Off duty).
 */
export const DriverAssignSelect: React.FC<DriverAssignSelectProps> = ({
  trip,
  drivers,
  allTrips,
  onAssign,
  className = "",
  disabled = false,
  disabledTitle = APPROVE_BEFORE_DRIVER_TOOLTIP,
  allowUnassign = true,
  placeholder = "Unassigned",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const positionMenuRef = useRef<() => void>(() => {});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: searchResponse, isFetching: searching } = useGetDriversQuery(
    { page: 1, limit: 50, searchTerm: debouncedSearch },
    { skip: !open || !debouncedSearch, refetchOnMountOrArgChange: true },
  );

  const searchedDrivers = useMemo(
    () => (searchResponse?.data || []).map(mapApiDriver),
    [searchResponse],
  );

  const pool = useMemo(() => {
    const byId = new Map<string, any>();
    (drivers || []).forEach((d: any) => {
      if (d?.id) byId.set(String(d.id), d);
    });
    searchedDrivers.forEach((d) => {
      if (d?.id) byId.set(String(d.id), d);
    });
    return Array.from(byId.values());
  }, [drivers, searchedDrivers]);

  const query = search.trim().toLowerCase();

  const scored = useMemo(() => {
    if (!trip) {
      return pool
        .filter((d) => matchesDriverSearch(d, query))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .map((driver) => ({
          driver,
          conflict: false,
          fit: true,
          recommended: false,
          tags: [] as string[],
        }));
    }
    return suggestDrivers(trip, pool, allTrips).filter((s) => matchesDriverSearch(s.driver, query));
  }, [trip, pool, allTrips, query]);

  const selectedId = String(trip?.driverId || "");
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      pool.find((d) => String(d.id) === selectedId) ||
      (drivers || []).find((d: any) => String(d.id) === selectedId) ||
      (trip?.driverName ? { id: selectedId, name: trip.driverName } : null)
    );
  }, [selectedId, pool, drivers, trip]);

  const selectedHasDuty =
    selected != null && (selected.isOnDuty !== undefined || selected.onDuty !== undefined);

  const positionMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Stay anchored under the field (never jump to the top of the viewport).
    const width = Math.max(rect.width, MENU_WIDTH);
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    const gap = 4;
    const top = rect.bottom + gap;
    const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, window.innerHeight - top - 8));
    setCoords({ top, left, width, maxHeight });
  };
  positionMenuRef.current = positionMenu;

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  const openMenu = () => {
    if (disabled) return;
    positionMenu();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const onScrollOrResize = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        closeMenu();
        return;
      }
      positionMenuRef.current();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const handle = (id: string) => {
    if (disabled) return;
    onAssign(id);
    closeMenu();
    if (!id || !trip) return;
    const s = scored.find((x) => String(x.driver.id) === String(id));
    if (s?.conflict)
      toast(`${s.driver.name} has an overlapping trip — force-assigned`, { icon: "⚠️" });
    else if (s && !s.fit)
      toast(`${s.driver.name}'s vehicle may not fit a ${trip.mobility} rider — assigned anyway`, {
        icon: "⚠️",
      });
    else if (s && !isDriverOnDuty(s.driver))
      toast(`${s.driver.name} is off duty — assigned anyway`, { icon: "⚠️" });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={disabled ? disabledTitle : selected?.name || placeholder}
        onClick={(e) => {
          e.stopPropagation();
          if (open) closeMenu();
          else openMenu();
        }}
        className={`w-full text-left flex items-center justify-between gap-1 ${className}${disabled ? " cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="min-w-0">
          {selected ? (
            <>
              <span className="block truncate text-xs font-medium text-ink">{selected.name}</span>
              {selectedHasDuty && (
                <span
                  className={`block truncate text-[10px] font-medium ${isDriverOnDuty(selected) ? "text-accent" : "text-ink-4"}`}
                >
                  {driverDutyStatusLabel(selected)}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-ink-4">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-ink-4 transition-transform ${open ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
            className="fixed z-[80] bg-white border border-line-2 rounded-xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-line-2 bg-bg/20 shrink-0">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search driver by name..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-line-2 rounded-lg text-ink placeholder:text-ink-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="overflow-y-auto p-1 space-y-0.5 custom-scrollbar flex-1 min-h-0">
              {allowUnassign && !query && (
                <button
                  type="button"
                  onClick={() => handle("")}
                  className={`w-full px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    !selectedId
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-ink-4 hover:bg-bg"
                  }`}
                >
                  Unassigned
                </button>
              )}

              {(searching || (query && query !== debouncedSearch.toLowerCase())) &&
              scored.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-4 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Searching…
                </div>
              ) : scored.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-4">
                  {query ? `No drivers found for "${search.trim()}"` : "No drivers available"}
                </div>
              ) : (
                scored.map((s) => {
                  const onDuty = isDriverOnDuty(s.driver);
                  const isSelected = selectedId === String(s.driver.id);
                  return (
                    <button
                      key={s.driver.id}
                      type="button"
                      onClick={() => handle(String(s.driver.id))}
                      className={`w-full p-2 rounded-lg flex items-center justify-between gap-2 text-left transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-bg"
                      } ${s.conflict ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          initials={s.driver.initials || "?"}
                          src={s.driver.image || s.driver.profile}
                          size="xs"
                          online={onDuty}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-xs truncate ${isSelected ? "font-semibold text-primary" : "font-medium text-ink"}`}
                          >
                            {s.driver.name}
                          </p>
                          <p
                            className={`text-[10px] font-medium truncate ${onDuty ? "text-accent" : "text-ink-4"}`}
                          >
                            {driverDutyStatusLabel(s.driver)}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check size={10} className="text-white" />
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
