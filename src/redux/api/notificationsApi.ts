import { baseApi } from '../baseApi'

export interface INotificationItem {
  _id: string
  sender: string | any
  text: string
  title?: string
  message?: string
  receiver?: string | any
  audience?: string
  type?: string
  category?: string
  read?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export interface ISendNotificationPayload {
  sender: string
  text: string
  title?: string
  message?: string
  receiver?: string
  audience?: string
  priority?: string
  type?: string
  category?: string
  [key: string]: any
}

export interface INotificationsQueryParams {
  page?: number
  limit?: number
  search?: string
}

export interface IGetNotificationsResponse {
  success: boolean
  message?: string
  data: INotificationItem[]
  pagination?: {
    total: number
    limit: number
    page: number
    totalPage: number
  }
}

export interface IUnreadCountResponse {
  success: boolean
  message?: string
  data?: number | { unreadCount?: number; count?: number; total?: number; unread?: number }
  count?: number
  unreadCount?: number
}

const normalizeUnreadCount = (response: unknown): number => {
  const body = response as IUnreadCountResponse | null | undefined
  if (!body) return 0

  const data = body.data
  if (typeof data === 'number' && Number.isFinite(data)) return Math.max(0, data)
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['unreadCount', 'count', 'total', 'unread']) {
      const v = obj[key]
      if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, v)
    }
  }

  if (typeof body.unreadCount === 'number' && Number.isFinite(body.unreadCount)) {
    return Math.max(0, body.unreadCount)
  }
  if (typeof body.count === 'number' && Number.isFinite(body.count)) {
    return Math.max(0, body.count)
  }

  return 0
}

const normalizeNotificationsResponse = (response: unknown): IGetNotificationsResponse => {
  const body = response as Record<string, unknown> | null | undefined
  const list = Array.isArray(body?.data)
    ? (body.data as INotificationItem[])
    : Array.isArray(response)
      ? (response as INotificationItem[])
      : []
  return {
    success: body?.success !== false,
    message: body?.message as string | undefined,
    data: list,
    pagination: body?.pagination as IGetNotificationsResponse['pagination'],
  }
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<IGetNotificationsResponse, INotificationsQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search?.trim()) queryParams.search = params.search.trim()
        }
        return {
          url: '/notification',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeNotificationsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Notifications' as const, id: _id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => ({
        url: '/notification/count-unread',
        method: 'GET',
      }),
      transformResponse: normalizeUnreadCount,
      providesTags: [{ type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),
    markAllNotificationsRead: builder.mutation<{ success: boolean; message?: string }, void>({
      query: () => ({
        url: '/notification/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'UNREAD_COUNT' },
        { type: 'Notifications', id: 'LIST' },
        'Notifications',
      ],
    }),
    sendNotification: builder.mutation<{ success: boolean; message?: string; data?: any }, ISendNotificationPayload>({
      query: (body) => ({
        url: '/notification',
        method: 'POST',
        body: {
          ...body,
          sender: body.sender,
          text: body.text || body.message || body.title || '',
        },
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useSendNotificationMutation,
} = notificationsApi
