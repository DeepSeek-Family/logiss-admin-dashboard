// Dispatch permission matrix — Admin assigns these individually per Dispatch user.
export interface PermItem { key: string; label: string }
export interface PermGroup { group: string; perms: PermItem[] }

export const PERMISSION_GROUPS: PermGroup[] = [
  {
    group: 'Trip Management',
    perms: [
      { key: 'trips.view', label: 'View Trips' },
      { key: 'trips.create', label: 'Create Trips' },
      { key: 'trips.edit', label: 'Edit Trips' },
      { key: 'trips.cancel', label: 'Cancel Trips' },
      { key: 'trips.delete', label: 'Delete Trips' },
    ],
  },
  {
    group: 'Dispatch Operations',
    perms: [
      { key: 'dispatch.assign', label: 'Assign Rider' },
      { key: 'dispatch.reassign', label: 'Reassign Rider' },
      { key: 'dispatch.status', label: 'Update Trip Status' },
      { key: 'dispatch.schedules', label: 'Manage Schedules' },
    ],
  },
  {
    group: 'Client Management',
    perms: [
      { key: 'clients.view', label: 'View Clients' },
      { key: 'clients.create', label: 'Create Clients' },
      { key: 'clients.edit', label: 'Edit Clients' },
    ],
  },
  {
    group: 'Facility Access',
    perms: [
      { key: 'facilities.view', label: 'View Facilities' },
      { key: 'facilities.manage', label: 'Manage Facilities' },
    ],
  },
  {
    group: 'Financial Access',
    perms: [
      { key: 'finance.billing', label: 'View Billing' },
      { key: 'finance.invoices', label: 'View Invoices' },
      { key: 'finance.export', label: 'Export Financial Reports' },
    ],
  },
  {
    group: 'Reports & Analytics',
    perms: [
      { key: 'reports.view', label: 'View Reports' },
      { key: 'reports.export', label: 'Export Reports' },
    ],
  },
  {
    group: 'User Management',
    perms: [
      { key: 'users.view', label: 'View Users' },
      { key: 'users.create', label: 'Create Users' },
      { key: 'users.edit', label: 'Edit Users' },
      { key: 'users.delete', label: 'Delete Users' },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));

// A sensible starter set for a new dispatcher (read + core ops, no destructive/admin).
export const DEFAULT_DISPATCH_PERMISSIONS = [
  'trips.view', 'trips.create',
  'dispatch.assign', 'dispatch.reassign', 'dispatch.status', 'dispatch.schedules',
  'clients.view', 'facilities.view',
];

// Assignable facilities/programs for Facility Users — sourced from the CMS-managed
// registry (FACILITY_PROGRAMS) so it's a single source of truth, active ones only.
import { FACILITY_PROGRAMS } from '@/data/mockData';
export const FACILITIES = FACILITY_PROGRAMS.filter(f => f.active).map(f => f.name);

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  dispatcher: 'Dispatch',
  facility: 'Facility User',
};
