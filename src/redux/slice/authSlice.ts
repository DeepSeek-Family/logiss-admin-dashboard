import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth-storage'

interface AuthState {
  token: string | null
  refreshToken: string | null
  role: string | null
  user: any | null
}

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
const initialRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
const initialRole = typeof localStorage !== 'undefined' ? localStorage.getItem('logiss-role') : null

const initialState: AuthState = {
  token: initialToken,
  refreshToken: initialRefreshToken,
  role: initialRole,
  user: null,
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
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY)
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
          localStorage.setItem('logiss-role', action.payload.role)
        } else {
          localStorage.removeItem('logiss-role')
        }
      }
      if (action.payload.user !== undefined) {
        state.user = action.payload.user
      }
    },
    logout: (state) => {
      state.token = null
      state.refreshToken = null
      state.role = null
      state.user = null
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem('logiss-role')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
