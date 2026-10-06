// Page-level permission matrix — Admin assigns allowed route paths per Dispatch user.
export interface PermItem { key: string; label: string; path: string }
export interface PermGroup { group: string; perms: PermItem[] }

export const PERMISSION_GROUPS: PermGroup[] = [
  {
    group: 'Core Operations',
    perms: [
      { key: '/dashboard', label: 'Dashboard', path: '/dashboard' },
      { key: '/operations', label: 'Operations', path: '/operations' },
      { key: '/bookings', label: 'Bookings', path: '/bookings' },
      { key: '/create-booking', label: 'Create Booking', path: '/create-booking' },
      { key: '/live', label: 'Live Trips', path: '/live' },
    ],
  },
  {
    group: 'Fleet & Users',
    perms: [
      { key: '/drivers', label: 'Drivers', path: '/drivers' },
      { key: '/riders', label: 'Riders', path: '/riders' },
      { key: '/applications', label: 'Driver Applications', path: '/applications' },
      { key: '/fleet', label: 'Fleet', path: '/fleet' },
      { key: '/fleet/:id', label: 'Fleet Details', path: '/fleet/:id' },
    ],
  },
  {
    group: 'Trips & Coverage',
    perms: [
      { key: '/trips', label: 'Trip History', path: '/trips' },
      { key: '/schedule', label: 'Scheduled Trips', path: '/schedule' },
      { key: '/coverage', label: 'Service Coverage', path: '/coverage' },
    ],
  },
  {
    group: 'Reports & Finance',
    perms: [
      { key: '/reports', label: 'Reports', path: '/reports' },
      { key: '/finance', label: 'Finance', path: '/finance' },
      { key: '/transactions', label: 'Transactions', path: '/transactions' },
    ],
  },
  {
    group: 'System & Management',
    perms: [
      { key: '/staff', label: 'Staff Management', path: '/staff' },
      { key: '/cms', label: 'CMS', path: '/cms' },
      { key: '/support', label: 'Support', path: '/support' },
      { key: '/push', label: 'Push Notifications', path: '/push' },
      { key: '/notifications', label: 'Notifications', path: '/notifications' },
      { key: '/settings', label: 'Settings', path: '/settings' },
      { key: '/profile', label: 'Profile', path: '/profile' },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));

export const DEFAULT_DISPATCH_PERMISSIONS = [
  '/dashboard',
  '/operations',
  '/bookings',
  '/create-booking',
  '/live',
  '/drivers',
  '/riders',
  '/trips',
  '/schedule',
  '/reports',
];

import { FACILITY_PROGRAMS } from '@/data/mockData';
export const FACILITIES = FACILITY_PROGRAMS.filter(f => f.active).map(f => f.name);

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  dispatcher: 'Dispatch',
  facility: 'Facility User',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,
  dispatcher: DEFAULT_DISPATCH_PERMISSIONS,
  facility: ['/bookings', '/create-booking', '/trips'],
};

/** True when the given role or user accessScope is allowed the page route. */
export const can = (role: string | null | undefined, key: string, accessScope?: string[]): boolean => {
  if (!role) return false;
  if (role === 'admin') return true;
  if (accessScope && Array.isArray(accessScope)) {
    const cleanKey = key.startsWith('/') ? key : `/${key}`;
    const rawKey = key.replace(/^\//, '');
    return accessScope.includes(cleanKey) || accessScope.includes(rawKey);
  }
  return ROLE_PERMISSIONS[role]?.includes(key) ?? false;
};
