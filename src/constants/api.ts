/** REST paths — used when `VITE_USE_MOCK=false`. */
export const API = {
  trips: '/booking',
  trip: (id: string) => `/booking/${id}`,
  tripStatus: (id: string) => `/booking/${id}`,
  tripAssign: (id: string) => `/booking/${id}`,
  drivers: '/applications/drivers',
  driver: (id: string) => `/applications/${id}`,
  fleet: '/fleet',
  vehicle: (id: string) => `/fleet/${id}`,
  users: '/users',
  usersInvite: '/users/invite',
} as const;
