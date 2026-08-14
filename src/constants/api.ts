/** REST paths — used when `VITE_USE_MOCK=false`. */
export const API = {
  trips: '/trips',
  trip: (id: string) => `/trips/${id}`,
  tripStatus: (id: string) => `/trips/${id}/status`,
  tripAssign: (id: string) => `/trips/${id}/assign`,
  drivers: '/drivers',
  driver: (id: string) => `/drivers/${id}`,
  fleet: '/fleet',
  vehicle: (id: string) => `/fleet/${id}`,
  users: '/users',
  usersInvite: '/users/invite',
} as const;
