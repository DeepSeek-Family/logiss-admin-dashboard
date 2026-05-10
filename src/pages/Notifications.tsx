import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  CheckSquare,
  Clock,
  Navigation,
  ChevronRight,
  Truck,
  FileCheck,
  CreditCard,
  Activity,
  UserCheck,
  MapPin,
  ShieldAlert,
  Phone,
  Filter,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { timeAgo } from '../utils/helpers';

const ALL_NOTIFICATIONS = [
  {
    id: 1, type: 'critical', read: false,
    icon: ShieldAlert, color: 'text-urgent', bg: 'bg-urgent-light',
    category: 'SOS Alert',
    title: 'SOS Emergency Alert — Driver #DRV-2024-4407',
    message: 'Robert Kim has triggered an emergency SOS on Trip LOGISS-2851. Last known location: 8100 Three Chopt Rd, Henrico. Dispatching backup.',
    time: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    action: 'View Trip',
  },
  {
    id: 2, type: 'warning', read: false,
    icon: AlertTriangle, color: 'text-urgent', bg: 'bg-urgent-light',
    category: 'Incident Report',
    title: 'High-Severity Incident Filed — Trip LOGISS-2842',
    message: 'A reckless driving incident report was filed by rider Linda Adams against Driver Robert Kim. Immediate supervisor review is required.',
    time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    action: 'Review Report',
  },
  {
    id: 3, type: 'warning', read: false,
    icon: Navigation, color: 'text-warning', bg: 'bg-warning/10',
    category: 'No-Show',
    title: 'Rider No-Show — Trip LOGISS-2859',
    message: 'Driver Maria Garcia reports Nancy Adams did not appear at 5400 Midlothian Tpke after 8-minute wait. No-Show approval required.',
    time: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    action: 'Approve No-Show',
  },
  {
    id: 4, type: 'warning', read: false,
    icon: FileCheck, color: 'text-warning', bg: 'bg-warning/10',
    category: 'Compliance',
    title: 'Insurance Policy Expiring — VEH-001',
    message: 'Insurance policy INS-48291 for Ford Transit (VA · 4KL-8392) expires on Feb 14, 2026. Renewal action required within 14 days.',
    time: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    action: 'Update Document',
  },
  {
    id: 5, type: 'success', read: false,
    icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent-light',
    category: 'Trip',
    title: 'Trip Completed — LOGISS-2847',
    message: 'Driver David Wilson has successfully completed Margaret Thompson\'s round trip to Chippenham Medical Center. Duration: 36 min · 8.2 miles.',
    time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    action: 'View Trip',
  },
  {
    id: 6, type: 'success', read: false,
    icon: UserCheck, color: 'text-accent', bg: 'bg-accent-light',
    category: 'Application',
    title: 'Driver Application Approved — Jennifer Carter',
    message: 'Jennifer Carter\'s NEMT driver application (APP-2024-1847) has passed background check and is approved for fleet onboarding.',
    time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    action: 'View Application',
  },
  {
    id: 7, type: 'info', read: true,
    icon: MapPin, color: 'text-primary', bg: 'bg-primary-light',
    category: 'Will Call',
    title: 'Will Call Ready — Trip LOGISS-2840',
    message: 'Dorothy Phillips has called in from St. Mary\'s Hospital and is ready for return pickup to 5421 Patterson Ave, Richmond.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    action: 'Dispatch Return',
  },
  {
    id: 8, type: 'info', read: true,
    icon: Truck, color: 'text-primary', bg: 'bg-primary-light',
    category: 'New Booking',
    title: 'New Booking Request — Evelyn Martinez',
    message: 'A new chemotherapy transport booking (LOGISS-2855) has been submitted for April 30 at 7:45 AM, requiring a wheelchair-accessible vehicle.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    action: 'Review Booking',
  },
  {
    id: 9, type: 'info', read: true,
    icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50',
    category: 'Financial',
    title: 'Payment Authorization Failed — LOGISS-2852',
    message: 'The $8.50 payment authorization for Charles Brown (Self-Pay) has failed. Manual payment follow-up may be required.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    action: 'View Transaction',
  },
  {
    id: 10, type: 'info', read: true,
    icon: Info, color: 'text-ink-3', bg: 'bg-bg',
    category: 'System',
    title: 'Scheduled System Maintenance',
    message: 'The LOGISS platform will undergo routine maintenance on Sunday, May 2nd between 2:00 AM — 4:00 AM EST. Expect brief service interruption.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    action: null,
  },
];

const CATEGORIES = ['All', 'Trip', 'Compliance', 'No-Show', 'Incident Report', 'Application', 'Will Call', 'Financial', 'System', 'SOS Alert'];

const Notifications = ({ role }: { role?: string | null }) => {
  const [items, setItems] = useState<any[]>(ALL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');

  const unreadCount = items.filter(n => !n.read).length;

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteItem = (id: number) => setItems(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setItems([]);

  const filtered = activeFilter === 'All' ? items : items.filter(n => n.category === activeFilter);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Communication Hub</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-urgent text-white text-xs font-extrabold rounded-full leading-none">{unreadCount}</span>
            )}
          </div>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">Stay updated with fleet, trip, and system operational alerts</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" icon={CheckSquare} onClick={markAllRead}>Mark All Read</Button>
          )}
          <Button variant="ghost" size="sm" icon={Trash2} className="text-ink-4" onClick={clearAll}>Clear All</Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Filter size={14} className="text-ink-4 shrink-0" />
        {CATEGORIES.map(cat => {
          const count = cat === 'All' ? items.filter(n => !n.read).length : items.filter(n => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeFilter === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-ink-3 border border-line-2 hover:border-line hover:text-ink'
                }`}
            >
              {cat}
              {count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none ${activeFilter === cat ? 'bg-white/20 text-white' : 'bg-urgent/10 text-urgent'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-bg rounded-full flex items-center justify-center text-ink-4 mb-6">
              <Bell size={36} className="opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-ink">All caught up!</h3>
            <p className="text-ink-3 max-w-xs mt-2 text-sm">No notifications in this category. Check back later.</p>
          </div>
        )}

        {filtered.map(notif => (
          <div
            key={notif.id}
            className={`relative flex gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-md ${notif.read
                ? 'bg-white border-line-2 opacity-80'
                : 'bg-white border-primary/10 shadow-sm'
              }`}
            onClick={() => markRead(notif.id)}
          >
            {/* Unread dot */}
            {!notif.read && (
              <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${notif.bg} ${notif.color}`}>
              <notif.icon size={22} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${notif.bg} ${notif.color}`}>
                    {notif.category}
                  </span>
                  {!notif.read && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-primary">New</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-ink-4 flex items-center gap-1 uppercase tracking-widest shrink-0 bg-bg px-2 py-1 rounded-lg">
                  <Clock size={10} /> {timeAgo(notif.time)}
                </span>
              </div>

              <h4 className={`text-sm font-extrabold mb-1.5 leading-snug ${notif.read ? 'text-ink-2' : 'text-ink'}`}>
                {notif.title}
              </h4>
              <p className="text-xs font-medium text-ink-3 leading-relaxed mb-3">{notif.message}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {notif.action && (
                    <button className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 transition-colors ${notif.color} hover:opacity-70`}>
                      {notif.action} <ChevronRight size={11} />
                    </button>
                  )}
                  {!notif.read && (
                    <button
                      className="text-[10px] font-bold text-ink-4 uppercase tracking-widest hover:text-ink transition-colors"
                      onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <button
                  className="text-[10px] font-bold text-ink-4 uppercase tracking-widest hover:text-urgent transition-colors opacity-0 group-hover:opacity-100"
                  onClick={e => { e.stopPropagation(); deleteItem(notif.id); }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="pt-4 text-center">
          <p className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.2em]">Showing last 30 days of activity</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
