import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react'
import { RESET_PASSWORD_TOKEN_KEY, AUTH_TOKEN_KEY } from '@/constants/auth-storage'
import { isTokenExpired, handleAuthSessionExpired, handleForbiddenAccess } from '@/utils/authSession'
import { logout } from '@/redux/slice/authSlice'

type AuthStateSlice = { auth: { token: string | null } }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api/v1',
  prepareHeaders: (headers, { getState, endpoint }) => {
    const authToken =
      (getState() as AuthStateSlice).auth?.token ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null)
    const resetToken =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
        : null

    if (endpoint === 'resetPassword' && resetToken) {
      headers.set('authorization', resetToken)
      headers.set('Authorization', resetToken)
      headers.set('resettoken', resetToken)
    } else if (authToken) {
      headers.set('authorization', `Bearer ${authToken}`)
    }
    return headers
  },
})

const baseQueryWithAuthHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  // Proactively check if token is expired before sending request
  const state = api.getState() as AuthStateSlice
  const currentToken =
    state.auth?.token ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null)

  const isAuthExemptEndpoint =
    typeof args === 'object' &&
    (args.url?.includes('reset') ||
      args.url?.includes('forgot') ||
      args.url?.includes('verify') ||
      args.url?.includes('resend') ||
      args.url?.includes('/auth/login'))

  if (currentToken && !isAuthExemptEndpoint && isTokenExpired(currentToken)) {
    api.dispatch(logout())
    if (baseApi?.util?.resetApiState) {
      api.dispatch(baseApi.util.resetApiState())
    }
    handleAuthSessionExpired({ reason: 'Session expired. Please log in again.' })
    return {
      error: {
        status: 401,
        data: { message: 'Token expired' },
      },
    }
  }

  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    const status = result.error.status
    const errorData = result.error.data as { message?: string } | undefined

    if (status === 401) {
      // Token expired or invalid session
      api.dispatch(logout())
      if (baseApi?.util?.resetApiState) {
        api.dispatch(baseApi.util.resetApiState())
      }
      handleAuthSessionExpired({
        reason: errorData?.message || 'Session expired. Please log in again.',
      })
    } else if (status === 403) {
      // Forbidden: redirect to login page
      api.dispatch(logout())
      if (baseApi?.util?.resetApiState) {
        api.dispatch(baseApi.util.resetApiState())
      }
      handleForbiddenAccess({
        message: errorData?.message || 'Access forbidden (403): Redirecting to login...',
      })
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithAuthHandling,
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
    'Payers',
    'Counties',
    'Riders',
    'Facilities',
    'Mobility',
    'CompanySupport',
    'DashboardOverview',
    'all_reports',
    'trip_distribution',
    'Payments',
    'Dispatchers',
  ],
  endpoints: () => ({}),
})
