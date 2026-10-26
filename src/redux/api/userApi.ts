import { baseApi } from '../baseApi'

export interface IBannedUser {
  _id: string
  id?: string
  isBanned?: boolean
  firstName?: string
  lastName?: string
  role?: string
}

export interface IToggleUserBannedResponse {
  success: boolean
  message?: string
  data?: IBannedUser
}

const unwrapBannedUser = (response: unknown): IBannedUser | undefined => {
  const raw = (response as { data?: unknown })?.data ?? response
  if (raw && typeof raw === 'object' && ('_id' in raw || 'id' in raw)) {
    return raw as IBannedUser
  }
  return undefined
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleUserBanned: builder.mutation<IToggleUserBannedResponse, string>({
      query: (id) => ({
        url: `/user/banned/${id}`,
        method: 'PATCH',
      }),
      transformResponse: (response: unknown): IToggleUserBannedResponse => ({
        success: (response as { success?: boolean })?.success !== false,
        message: (response as { message?: string })?.message,
        data: unwrapBannedUser(response),
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'User', id },
        { type: 'Riders', id },
        { type: 'Riders', id: 'LIST' },
        { type: 'Drivers', id },
        { type: 'Drivers', id: 'LIST' },
        { type: 'Applications', id },
        { type: 'Applications', id: 'LIST' },
        { type: 'Dispatchers', id },
        { type: 'Dispatchers', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const { useToggleUserBannedMutation } = userApi
