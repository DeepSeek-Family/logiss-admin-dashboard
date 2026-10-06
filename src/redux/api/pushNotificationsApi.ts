import { baseApi } from '../baseApi'

export interface IPushNotificationPayload {
  title: string
  description: string
  audience: string
  [key: string]: any
}

export interface IPushNotificationResponse {
  success: boolean
  message?: string
  data?: any
}

export const pushNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendPushNotification: builder.mutation<IPushNotificationResponse, IPushNotificationPayload>({
      query: (body) => ({
        url: '/notifications/send',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
})

export const { useSendPushNotificationMutation } = pushNotificationsApi
