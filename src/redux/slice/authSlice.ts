import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  ROLE_STORAGE_KEY,
  USER_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_KEY,
} from '@/constants/auth-storage'

interface AuthState {
  token: string | null
  refreshToken: string | null
  role: string | null
  user: any | null
}

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
const initialRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
const initialRole = typeof localStorage !== 'undefined' ? localStorage.getItem(ROLE_STORAGE_KEY) : null
const initialUser = typeof localStorage !== 'undefined'
  ? (() => {
      try {
        const raw = localStorage.getItem(USER_STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })()
  : null

const initialState: AuthState = {
  token: initialToken,
  refreshToken: initialRefreshToken,
  role: initialRole,
  user: initialUser,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken?: string; refreshToken?: string; token?: string; role?: string; user?: any }>
    ) => {
      const accessToken = action.payload.accessToken || action.payload.token
      if (accessToken !== undefined) {
        state.token = accessToken
        if (accessToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
          localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, accessToken)
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
        }
      }
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken
        if (action.payload.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken)
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY)
        }
      }
      if (action.payload.role !== undefined) {
        state.role = action.payload.role
        if (action.payload.role) {
          localStorage.setItem(ROLE_STORAGE_KEY, action.payload.role)
        } else {
          localStorage.removeItem(ROLE_STORAGE_KEY)
        }
      }
      if (action.payload.user !== undefined) {
        state.user = action.payload.user
        if (action.payload.user) {
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(action.payload.user))
          } catch { /* ignore */ }
        } else {
          localStorage.removeItem(USER_STORAGE_KEY)
        }
      }
    },
    logout: (state) => {
      state.token = null
      state.refreshToken = null
      state.role = null
      state.user = null
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
      try {
        sessionStorage.clear()
      } catch {
        /* ignore */
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
