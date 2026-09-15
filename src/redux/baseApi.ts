import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RESET_PASSWORD_TOKEN_KEY } from '@/constants/auth-storage'

type AuthStateSlice = { auth: { token: string | null } }

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api/v1',
    prepareHeaders: (headers, { getState, endpoint }) => {
      const authToken = (getState() as AuthStateSlice).auth.token
      const resetToken =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
          : null

      if (endpoint === 'resetPassword' && resetToken) {
        headers.set('resettoken', resetToken)
      } else if (authToken) {
        headers.set('authorization', `Bearer ${authToken}`)
      }
      return headers
    },
  }),
  tagTypes: [
    'Auth',
    'Profile',
    'User',
    'Overview',
    'Analytics',
    'LiveTrip',
    'Trips',
    'Drivers',
    'Fleet',
    'Vehicles',
    'Applications',
    'Reports',
    'Notifications',
    'Settings',
    'Faqs',
    'rules',
    'bookings',
  ],
  endpoints: () => ({}),
})
