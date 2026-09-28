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

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<IGetNotificationsResponse, void>({
      query: () => ({
        url: '/notification',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
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

export const { useGetNotificationsQuery, useSendNotificationMutation } = notificationsApi
