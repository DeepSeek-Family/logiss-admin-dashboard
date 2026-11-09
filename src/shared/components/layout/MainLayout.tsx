import React, { Suspense } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  Inbox,
  Map,
  MapPin,
  Users,
  FileCheck,
  Flag,
  Truck,
  Settings,
  Search,
  Bell,
  Phone,
  ChevronDown,
  LogOut,
  CalendarDays,
  Car,
  User,
  HelpCircle,
  Lock,
  FileText,
  CreditCard,
  UserPlus,
  Activity,
  Send,
  Loader2,
  Menu,
  X,
  PanelsTopLeft,
} from "lucide-react";
import { Avatar, Badge, Button } from "@/shared/components/ui";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useGetUnreadNotificationCountQuery } from "@/redux/api/notificationsApi";
import { AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY } from "@/constants/auth-storage";
import { ROUTES } from "@/constants/routes";
import { can } from "@/features/userAccess/permissions";
import toast from "react-hot-toast";
import { getDefaultRoute } from "@/routes/appRoutes";
import { useGetAuthUserByIdQuery } from "@/redux/api/userApi";
import { resolveMediaUrl } from "@/utils/imageUrl";
import {
  getUserDisplayId,
  getUserFullName,
  getUserInitials,
  getUserProfileImage,
  getUserRoleLabel,
  type AuthenticatedUserProfile,
} from "@/shared/utils/userProfileDisplay";
// import { useGetAllBookingsQuery } from '@/redux/api/bookingApi';
// import { useGetDriverApplicationsQuery, useGetDriversQuery } from '@/redux/api/driversApi';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
  active: boolean;
  badgeVariant?: "neutral" | "white" | "primary" | "accent" | "urgent";
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  badge,
  active,
  badgeVariant = "neutral",
}) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 group relative ${
      active
        ? "bg-primary-tint text-primary font-semibold"
        : "text-ink-2 hover:bg-bg hover:text-ink font-medium"
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon
        size={20}
        className={active ? "text-primary" : "text-ink-3 group-hover:text-primary transition-colors"}
      />
      <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
    </div>
    {badge && <Badge variant={active ? "primary-light" : (badgeVariant as any)}>{badge}</Badge>}
    {active && (
      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full"></div>
    )}
  </Link>
);

const RouteLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] w-full gap-3">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
    <p className="text-xs text-ink-4 font-medium">Loading page…</p>
  </div>
);

interface NavConfigItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
  isLive?: boolean;
}

interface NavConfigGroup {
  group: string;
  roles: string[];
  items: NavConfigItem[];
}

const NAV_CONFIG: NavConfigGroup[] = [
  {
    group: "Operations",
    roles: ["admin", "dispatcher"],
    items: [
      { id: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
      {
        id: ROUTES.operations,
        label: "Operations",
        icon: Activity,
        roles: ["admin", "dispatcher"],
      },
      { id: ROUTES.bookings, label: "Bookings", icon: Inbox, roles: ["admin", "dispatcher"] },
      {
        id: ROUTES.schedule,
        label: "Scheduled",
        icon: CalendarDays,
        roles: ["admin", "dispatcher"],
      },
      { id: ROUTES.trips, label: "Trip History", icon: Truck, roles: ["admin", "dispatcher"] },
      { id: ROUTES.reports, label: "Incident Reports", icon: Flag, roles: ["admin", "dispatcher"] },
    ],
  },
  {
    group: "Resources",
    roles: ["admin", "dispatcher"],
    items: [
      { id: ROUTES.fleet, label: "Fleet Management", icon: Car, roles: ["admin", "dispatcher"] },
      { id: ROUTES.riders, label: "Riders", icon: User, roles: ["admin", "dispatcher"] },
      { id: ROUTES.applications, label: "Applications", icon: FileCheck, roles: ["admin"] },
      { id: ROUTES.drivers, label: "Drivers", icon: Users, roles: ["admin", "dispatcher"] },
    ],
  },
  {
    group: "Administration",
    roles: ["admin", "dispatcher"],
    items: [
      {
        id: ROUTES.transactions,
        label: "Finance",
        icon: CreditCard,
        roles: ["admin", "dispatcher"],
      },
      {
        id: ROUTES.coverage,
        label: "Service & Tariffs",
        icon: MapPin,
        roles: ["admin", "dispatcher"],
      },
      {
        id: ROUTES.staff,
        label: "Dispatch Management",
        icon: UserPlus,
        roles: ["admin", "dispatcher"],
      },
      { id: ROUTES.cms, label: "CMS & Content", icon: FileText, roles: ["admin", "dispatcher"] },
      { id: ROUTES.push, label: "Push Notifications", icon: Send, roles: ["admin", "dispatcher"] },
      {
        id: ROUTES.systemLogs,
        label: "System Logs",
        icon: Activity,
        roles: ["admin", "dispatcher"],
      },
      {
        id: ROUTES.fundingSourceSetup,
        label: "Funding Sources",
        icon: PanelsTopLeft,
        roles: ["admin"],
      },
    ],
  },
];

interface MainLayoutProps {
  role: string | null;
  onLogout: () => void;
}

const MainLayout = ({ role, onLogout }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname;

  const authToken = useSelector((state: any) => state.auth?.token as string | null | undefined);
  const hasAuthToken =
    Boolean(authToken) ||
    (typeof localStorage !== "undefined" &&
      Boolean(localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)));

  const storedUser =
    (useSelector((state: any) => state.auth?.user) as AuthenticatedUserProfile | null) ||
    (() => {
      try {
        const u = typeof localStorage !== "undefined" ? localStorage.getItem("logiss-user") : null;
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    })();

  const storedUserId = String(storedUser?._id || storedUser?.id || storedUser?.userId || "");
  const { data: authenticatedUserResponse } = useGetAuthUserByIdQuery(storedUserId, {
    skip: !hasAuthToken || !storedUserId,
    refetchOnMountOrArgChange: true,
  });
  const currentUser = React.useMemo<AuthenticatedUserProfile | null>(() => {
    if (!storedUser && !authenticatedUserResponse?.data) return null;
    return {
      ...(storedUser || {}),
      ...(authenticatedUserResponse?.data || {}),
    };
  }, [authenticatedUserResponse?.data, storedUser]);
  const userFullName = getUserFullName(currentUser);
  const userInitials = getUserInitials(currentUser);
  const userDisplayId = getUserDisplayId(currentUser);
  const userRoleLabel = getUserRoleLabel(currentUser, role);
  const userProfileImage = resolveMediaUrl(getUserProfileImage(currentUser));

  const accessScope: string[] = currentUser?.accessScope || currentUser?.permissions || [];

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const mainScrollRef = React.useRef<HTMLElement>(null);
  /** Remount outlet only on route path changes — not on search/filter query params (avoids full-page flash). */
  const routeOutletKey = location.pathname;
  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !hasAuthToken,
    refetchOnMountOrArgChange: true,
  });

  React.useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);
  // --- Sidebar Badges & Driver Queries (Commented out to prevent unnecessary API calls across all pages. Uncomment when needed.) ---
  /*
  const { data: bookingsMeta } = useGetAllBookingsQuery({ page: 1, limit: 10 });
  const { data: applicationsMeta } = useGetDriverApplicationsQuery({ page: 1, limit: 1 });
  const { data: driversResponse } = useGetDriversQuery();
  const bookingsBadge = bookingsMeta?.pagination?.total != null
    ? String(bookingsMeta.pagination.total)
    : undefined;
  const applicationsBadge = applicationsMeta?.pagination?.total != null
    ? String(applicationsMeta.pagination.total)
    : undefined;

  const trips = bookingsMeta?.data || [];
  const drivers = driversResponse?.data || [];

  const liveTripsCount = (trips || []).filter((t: any) => ['in_trip', 'en_route', 'arrived', 'in-progress'].includes(t?.status || t?.bookingStatus)).length;
  const activeDriversCount = (drivers || []).filter((d: any) => d?.onDuty || d?.status === 'available').length;

  const searchResults = searchQuery.length >= 2 ? [
    ...(trips || []).filter((t: any) =>
      (t?.rider?.name || t?.userId?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t?.id || t?._id || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5).map((t: any) => {
      const riderName = t?.rider?.name || [t?.userId?.firstName, t?.userId?.lastName].filter(Boolean).join(' ') || 'Unknown Rider';
      const tripId = t?.id || t?._id || '---';
      const status = t?.status || t?.bookingStatus || '';
      return {
        type: 'trip',
        label: riderName,
        sub: `#${String(tripId).slice(-6)} · ${status.replace(/_/g, ' ')}`,
        dest: ['pending_review', 'confirmed', 'pending'].includes(status) ? ROUTES.bookings :
          ['in_trip', 'en_route', 'arrived', 'assigned', 'in-progress'].includes(status) ? ROUTES.live : ROUTES.trips,
      };
    }),
    ...(drivers || []).filter((d: any) =>
      (d?.name || [d?.firstName, d?.lastName].filter(Boolean).join(' ') || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d?.vehicle?.plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d?.id || d?._id || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3).map((d: any) => ({
      type: 'driver',
      label: d?.name || [d?.firstName, d?.lastName].filter(Boolean).join(' ') || 'Unknown Driver',
      sub: `${d?.vehicle?.plate || '---'} · ${(d?.status || '').replace(/_/g, ' ')}`,
      dest: ROUTES.drivers,
    })),
  ] : [];
  */

  React.useEffect(() => {
    const close = () => setProfileOpen(false);
    if (profileOpen) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [profileOpen]);

  const isNavItemVisible = React.useCallback(
    (item: NavConfigItem) => {
      if (!role) return false;
      if (!item.roles.includes(role) && !(role === "admin" && item.roles.includes("admin"))) {
        if (role !== "dispatcher" || !item.roles.includes("dispatcher")) return false;
      }
      if (item.id === ROUTES.systemLogs) return role === "admin" || role === "dispatcher";
      const pathKey = item.id.startsWith("/") ? item.id : `/${item.id}`;
      return can(role, pathKey, accessScope?.length ? accessScope : undefined);
    },
    [role, accessScope],
  );

  const pathForAccessCheck = React.useCallback((pathname: string) => {
    if (pathname.startsWith("/fleet/")) return ROUTES.fleet;
    if (pathname.startsWith("/coverage")) return ROUTES.coverage;
    return pathname.split("?")[0];
  }, []);

  React.useEffect(() => {
    if (!role || role === "admin") return;
    const path = pathForAccessCheck(page);
    if (path === ROUTES.profile || path === ROUTES.settings || path === ROUTES.notifications)
      return;
    if (path === ROUTES.systemLogs && (role === "admin" || role === "dispatcher")) return;
    if (can(role, path, accessScope?.length ? accessScope : undefined)) return;

    toast.error("You do not have permission to view this page.", { id: "page-access-denied" });
    const fallback = accessScope?.find(Boolean)?.startsWith("/")
      ? accessScope.find(Boolean)!
      : accessScope?.[0]
        ? `/${accessScope[0].replace(/^\//, "")}`
        : getDefaultRoute(role as "dispatcher");
    navigate(fallback, { replace: true });
  }, [page, role, accessScope, navigate]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans text-ink">
      {/* Sidebar */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-ink/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside className={`w-[248px] bg-white border-r border-line-2 fixed inset-y-0 left-0 flex flex-col z-30 transition-transform duration-150 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-line-2">
          <img src="/logo.png" alt="Logiss Rides" className="w-36 h-10 object-contain object-left" />
          <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-ink-4 hover:bg-bg md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-5">
          <div className="space-y-1.5">
            {NAV_CONFIG.flatMap((group) => group.items)
              .filter(isNavItemVisible)
              .map((item) => {
                // Badge logic (Commented out to prevent background API calls. Uncomment when needed.)
                /*
                const liveBadge = item.isLive ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot"></span>
                    {liveTripsCount}
                  </div>
                ) : item.id === ROUTES.bookings
                  ? bookingsBadge
                  : item.id === ROUTES.applications
                    ? applicationsBadge
                    : item.badge;
                */
                const liveBadge = item.badge;

                const isActive = item.id.includes("tab=schedule")
                  ? page === "/trips" && location.search.includes("tab=schedule")
                  : item.id === ROUTES.trips
                    ? page === ROUTES.trips && !location.search.includes("tab=schedule")
                    : item.id === ROUTES.dashboard
                      ? page === ROUTES.dashboard
                      : item.id === ROUTES.transactions
                        ? page === "/finance" || page === "/transactions"
                        : page === item.id || (item.id !== "/" && page.startsWith(item.id));

                return (
                  <NavItem
                    key={item.id}
                    to={item.id}
                    icon={item.icon}
                    label={item.label}
                    badge={liveBadge}
                    active={isActive}
                  />
                );
              })}
          </div>

          {isNavItemVisible({
            id: ROUTES.settings,
            label: "Settings",
            icon: Settings,
            roles: ["admin", "dispatcher"],
          }) && (
            <div className="pt-4 border-t border-line-2">
              <NavItem
                to={ROUTES.settings}
                icon={Settings}
                label="System Settings"
                active={page === ROUTES.settings}
              />
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-line">
          <div
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-urgent hover:bg-urgent-light/60 group"
          >
            <LogOut size={20} className="text-urgent" />
            <span className="text-base font-normal">Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        ref={mainScrollRef}
        className="flex-1 ml-0 md:ml-[248px] flex flex-col min-w-0 h-screen overflow-y-auto bg-bg"
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-line-2 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shrink-0">
          <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-ink-3 hover:bg-bg md:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(ROUTES.notifications)}
              className={`relative p-2 rounded-lg transition-colors ${page === ROUTES.notifications ? "bg-primary-light text-primary" : "text-ink-3 hover:bg-bg"}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-urgent text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen(!profileOpen);
                }}
                className={`w-9 h-9 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${profileOpen || page === ROUTES.profile ? "border-primary" : "border-line hover:border-primary"}`}
                title="Account"
              >
                <Avatar
                  initials={userInitials}
                  src={userProfileImage}
                  size="sm"
                  className="w-full h-full"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-line overflow-hidden z-50">
                  <div className="p-5 border-b border-line bg-bg/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar initials={userInitials} src={userProfileImage} size="md" />
                      <div>
                        <p className="text-sm font-medium text-ink leading-none">{userFullName}</p>
                        <p className="text-xs text-ink-4 mt-1">
                          ID:{" "}
                          {userDisplayId === "Not available" ? userDisplayId : `#${userDisplayId}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="primary-light"
                      className="w-full justify-center py-1 text-xs uppercase tracking-wide"
                    >
                      {userRoleLabel}
                    </Badge>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate(ROUTES.profile);
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-ink hover:bg-bg transition-colors group"
                    >
                      <User size={15} className="text-ink-3 group-hover:text-primary" />
                      <span>Account Info</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-urgent hover:bg-urgent-light transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <div key={routeOutletKey}>
            <ErrorBoundary key={routeOutletKey}>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
