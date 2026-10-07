import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Send
} from 'lucide-react';
import { Avatar, Badge, Button } from '@/shared/components/ui';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useNotifications } from '@/hooks/useNotifications';
import { ROUTES } from '@/constants/routes';
import { useGetAllBookingsQuery } from '@/redux/api/bookingApi';
import { useGetDriverApplicationsQuery, useGetDriversQuery } from '@/redux/api/driversApi';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badgeVariant?: 'neutral' | 'white' | 'primary' | 'accent' | 'urgent';
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
  badgeVariant = 'neutral',
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative ${
      active
        ? 'bg-primary text-white shadow-sm font-semibold'
        : 'text-ink-2 hover:bg-bg hover:text-ink font-medium'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={active ? 'text-white' : 'text-ink-3 group-hover:text-primary transition-colors'} />
      <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </div>
    {badge && (
      <Badge variant={active ? 'white' : (badgeVariant as any)}>{badge}</Badge>
    )}
    {active && (
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full shadow-sm"></div>
    )}
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
    group: 'Operations',
    roles: ['admin', 'dispatcher'],
    items: [
      { id: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
      { id: ROUTES.operations, label: 'Operations', icon: Activity, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.bookings, label: 'Bookings', icon: Inbox, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.trips, label: 'Trip History', icon: Truck, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.schedule, label: 'Scheduled', icon: CalendarDays, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.reports, label: 'Incident Reports', icon: Flag, roles: ['admin', 'dispatcher'] },
    ]
  },
  {
    group: 'Resources',
    roles: ['admin', 'dispatcher'],
    items: [
      { id: ROUTES.fleet, label: 'Fleet Management', icon: Car, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.riders, label: 'Riders', icon: User, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.drivers, label: 'Drivers', icon: Users, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.applications, label: 'Applications', icon: FileCheck, roles: ['admin'] },
    ]
  },
  {
    group: 'Administration',
    roles: ['admin', 'dispatcher'],
    items: [
      { id: ROUTES.transactions, label: 'Finance', icon: CreditCard, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.coverage, label: 'Service & Tariffs', icon: MapPin, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.staff, label: 'Dispatch Management', icon: UserPlus, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.cms, label: 'CMS & Content', icon: FileText, roles: ['admin', 'dispatcher'] },
      { id: ROUTES.push, label: 'Push Notifications', icon: Send, roles: ['admin', 'dispatcher'] },
    ]
  }
];

interface MainLayoutProps {
  role: string | null;
  onLogout: () => void;
}

const MainLayout = ({ role, onLogout }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname;

  const currentUser = useSelector((state: any) => state.auth?.user) || (() => {
    try {
      const u = typeof localStorage !== 'undefined' ? localStorage.getItem('logiss-user') : null;
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const accessScope: string[] = currentUser?.accessScope || currentUser?.permissions || [];

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const { unreadCount } = useNotifications();
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

  React.useEffect(() => {
    const close = () => setProfileOpen(false);
    if (profileOpen) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [profileOpen]);

  const isNavItemVisible = React.useCallback((item: NavConfigItem) => {
    if (!role) return false;
    if (role === 'admin') return item.roles.includes('admin');

    if (!item.roles.includes(role) && !item.roles.includes('dispatcher')) {
      return false;
    }

    if (accessScope && Array.isArray(accessScope) && accessScope.length > 0) {
      const cleanId = item.id.startsWith('/') ? item.id : `/${item.id}`;
      const rawId = item.id.replace(/^\//, '');

      return accessScope.some(s => {
        const cleanS = s.startsWith('/') ? s : `/${s}`;
        const rawS = s.replace(/^\//, '');
        if (cleanS === cleanId || rawS === rawId) return true;
        if (cleanId === '/finance' && (cleanS === '/transactions' || rawS === 'transactions')) return true;
        if (cleanId === '/transactions' && (cleanS === '/finance' || rawS === 'finance')) return true;
        return false;
      });
    }

    return true;
  }, [role, accessScope]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans text-ink">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-line fixed h-full flex flex-col z-20 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]">
        <div className="p-6 flex items-center justify-center mb-2">
          <img src="/logo.png" alt="Logiss Rides" className="w-48 h-auto max-h-24 object-contain" />
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide space-y-6">
          <div className="space-y-1.5">
            {NAV_CONFIG.flatMap(group => group.items)
              .filter(isNavItemVisible)
              .map(item => {
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

                const isActive = item.id.includes('tab=schedule')
                  ? (page === '/trips' && location.search.includes('tab=schedule'))
                  : (item.id === ROUTES.trips
                    ? (page === ROUTES.trips && !location.search.includes('tab=schedule'))
                    : (item.id === ROUTES.transactions
                      ? (page === '/finance' || page === '/transactions')
                      : (page === item.id || (item.id !== '/' && page.startsWith(item.id)))));

                return (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    badge={liveBadge}
                    active={isActive}
                    onClick={() => navigate(item.id)}
                  />
                );
              })}
          </div>

          {isNavItemVisible({ id: ROUTES.settings, label: 'Settings', icon: Settings, roles: ['admin', 'dispatcher'] }) && (
            <div className="pt-4 border-t border-line-2">
              <NavItem icon={Settings} label="System Settings" active={page === ROUTES.settings} onClick={() => navigate(ROUTES.settings)} />
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-line">
          <div
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-urgent hover:bg-urgent-light/60 group"
          >
            <LogOut size={20} className="text-urgent" />
            <span className="text-base font-normal">Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[260px] flex flex-col min-w-0 h-screen overflow-y-auto bg-bg/50">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-line flex items-center justify-end px-8 sticky top-0 z-10 shrink-0">

       

          <div className="flex items-center gap-2">
           

            <button
              onClick={() => navigate(ROUTES.notifications)}
              className={`relative p-2 rounded-lg transition-colors ${page === ROUTES.notifications ? 'bg-primary-light text-primary' : 'text-ink-3 hover:bg-bg'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-urgent text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-urgent border-2 border-white rounded-full"></span>
              )}
            </button>

           

        

            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className={`w-9 h-9 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 hover:shadow-sm ${profileOpen || page === ROUTES.profile ? 'border-primary' : 'border-line hover:border-primary'}`}
                title="Account"
              >
                <Avatar initials={role === 'admin' ? 'MH' : 'SR'} size="sm" className="w-full h-full" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-line overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                  <div className="p-5 border-b border-line bg-bg/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar initials={role === 'admin' ? 'MH' : 'SR'} size="md" />
                      <div>
                        <p className="text-sm font-medium text-ink leading-none">{role === 'admin' ? 'Marcus A. Holloway' : 'Sandra K. Reynolds'}</p>
                        <p className="text-xs text-ink-4 mt-1">ID: #{role === 'admin' ? 'LOGISS-882' : 'LOGISS-941'}</p>
                      </div>
                    </div>
                    <Badge variant="primary-light" className="w-full justify-center py-1 text-xs uppercase tracking-wide">
                      {role === 'admin' ? 'Administrator' : 'Dispatch Officer'}
                    </Badge>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => { navigate(ROUTES.profile); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-ink hover:bg-bg transition-all group"
                    >
                      <User size={15} className="text-ink-3 group-hover:text-primary" />
                      <span>Account Info</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-urgent hover:bg-urgent-light transition-all"
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
        <div className="p-8 flex-1">
          <div className="animate-fade-in">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
