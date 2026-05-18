import { lazy } from 'react';

export type AppRole = 'admin' | 'dispatcher';
export type SessionRole = AppRole | null;

export const isAppRole = (role: unknown): role is AppRole => (
  role === 'admin' || role === 'dispatcher'
);

export const getDefaultRoute = (role: SessionRole) => (
  role === 'admin' ? '/dashboard' : '/operations'
);

const Login = lazy(() => import('../pages/Login'));
const Operations = lazy(() => import('../pages/Operations'));
const Bookings = lazy(() => import('../pages/Bookings'));
const LiveTrips = lazy(() => import('../pages/LiveTrips'));
const Drivers = lazy(() => import('../pages/Drivers'));
const Applications = lazy(() => import('../pages/Applications'));
const Reports = lazy(() => import('../pages/Reports'));
const TripHistory = lazy(() => import('../pages/TripHistory'));
const Settings = lazy(() => import('../pages/Settings'));
const Fleet = lazy(() => import('../pages/Fleet'));
const FleetDetails = lazy(() => import('../pages/FleetDetails'));
const Schedule = TripHistory;
const Notifications = lazy(() => import('../pages/Notifications'));
const Profile = lazy(() => import('../pages/Profile'));
const CMS = lazy(() => import('../pages/CMS'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const Transactions = lazy(() => import('../pages/Transactions'));
const UserAccess = lazy(() => import('../pages/UserAccess'));
const Riders = lazy(() => import('../pages/Riders'));
const CreateBooking = lazy(() => import('../pages/CreateBooking'));

type LazyPage = React.LazyExoticComponent<React.ComponentType<any>>;

export interface AppRouteConfig {
  path?: string;
  index?: boolean;
  Component?: LazyPage;
  allowedRoles?: AppRole[];
  children?: AppRouteConfig[];
}

export const loginRoute = {
  path: '/login',
  Component: Login,
};

export const authenticatedRoutes: AppRouteConfig[] = [
  { path: 'operations', Component: Operations },
  { path: 'bookings', Component: Bookings },
  { path: 'live', Component: LiveTrips },
  { path: 'drivers', Component: Drivers },
  { path: 'riders', Component: Riders },
  { path: 'create-booking', Component: CreateBooking },
  { path: 'applications', Component: Applications },
  { path: 'reports', Component: Reports },
  { path: 'trips', Component: TripHistory },
  { path: 'settings', Component: Settings },
  { path: 'profile', Component: Profile },
  {
    path: 'fleet',
    children: [
      { index: true, Component: Fleet },
      { path: ':id', Component: FleetDetails },
    ],
  },
  { path: 'schedule', Component: TripHistory },
  { path: 'notifications', Component: Notifications },
  { path: 'dashboard', Component: AdminDashboard, allowedRoles: ['admin'] },
  { path: 'transactions', Component: Transactions, allowedRoles: ['admin'] },
  { path: 'staff', Component: UserAccess, allowedRoles: ['admin'] },
  { path: 'cms', Component: CMS, allowedRoles: ['admin'] },
  { path: 'support', Component: CMS, allowedRoles: ['admin'] },
];
