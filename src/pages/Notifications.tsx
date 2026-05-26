import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Navigation,
  FileCheck,
  CheckCircle2,
  UserCheck,
  MapPin,
  Truck,
  CreditCard,
  Info,
} from 'lucide-react';

import {
  NotificationList
} from '@/features/notifications';

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

const Notifications = ({ role }: { role?: string | null }) => {
  const [items, setItems] = useState<any[]>(ALL_NOTIFICATIONS);

  const unreadCount = items.filter(n => !n.read).length;

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteItem = (id: number) => setItems(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setItems([]);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink flex items-center gap-2">
            Notifications
            {unreadCount > 0 && <span className="text-sm font-medium text-white bg-urgent rounded-full px-2 py-0.5 leading-none">{unreadCount}</span>}
          </h1>
          <p className="text-sm text-ink-4 mt-0.5">Fleet, trip, and system alerts</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold">Mark all read</button>
          )}
          <button onClick={clearAll} className="text-xs text-ink-4 hover:text-ink font-semibold">Clear all</button>
        </div>
      </div>

      {/* Notification List */}
      <NotificationList
        filtered={items}
        onMarkRead={markRead}
        onDelete={deleteItem}
      />
    </div>
  );
};

export default Notifications;
