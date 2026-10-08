import { baseApi } from '../baseApi'

export interface LoginRequest {
  email: string
  password: string
  fcmToken?: string
  deviceToken?: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    [key: string]: any
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message?: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: {
          ...credentials,
          fcmToken: credentials.fcmToken || credentials.deviceToken,
          deviceToken: credentials.deviceToken || credentials.fcmToken,
        },
      }),
      invalidatesTags: ['Auth', 'Profile', 'User'],
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useLoginMutation, useChangePasswordMutation } = authApi
