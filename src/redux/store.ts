import { configureStore, isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import toast from 'react-hot-toast'
import { apis } from '@/redux/apis'
import { reducers } from '@/redux/reducers'

/**
 * Global RTK Query error middleware:
 * Catches unhandled network errors, 5xx server errors, rate limits, and timeouts.
 */
const rtkQueryErrorLogger: Middleware = () => (next) => (action: any) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload
    const status = payload?.status
    const endpointName = action.meta?.arg?.endpointName

    // Skip auth endpoints so LoginPage / recovery forms can handle their own messages
    const authEndpointNames = [
      'login',
      'forgotPassword',
      'resendOtp',
      'verifyEmail',
      'resetPassword',
    ]
    if (endpointName && authEndpointNames.includes(endpointName)) {
      return next(action)
    }

    // 401 & 403 are handled by baseQueryWithAuthHandling / authSession (logout & redirect)
    if (status === 401 || status === 403) {
      return next(action)
    }

    if (status === 'FETCH_ERROR') {
      toast.error('Network error: Unable to connect to server. Please check your internet connection.', {
        id: 'global-network-error',
      })
    } else if (status === 'TIMEOUT') {
      toast.error('Request timed out. The server took too long to respond.', {
        id: 'global-timeout-error',
      })
    } else if (status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.', {
        id: 'rate-limit-error',
      })
    } else if (typeof status === 'number' && status >= 500) {
      const serverMessage = payload?.data?.message || payload?.data?.error
      toast.error(serverMessage || `Server error (${status}). Please try again later.`, {
        id: `server-error-${status}`,
      })
    }
  }

  return next(action)
}

const apiReducers = Object.fromEntries(
  apis.map((api) => [api.reducerPath, api.reducer]),
)

const apiMiddleware = apis.map((api) => api.middleware) as Middleware[]

export const store = configureStore({
  reducer: {
    ...reducers,
    ...apiReducers,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddleware, rtkQueryErrorLogger),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
