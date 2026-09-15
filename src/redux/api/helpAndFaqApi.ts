import { baseApi } from '../baseApi'

export interface FaqItem {
  _id: string
  question: string
  ans: string
  role: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface FaqApiResponse {
  success: boolean
  message: string
  data: FaqItem[]
}

export interface SingleFaqApiResponse {
  success: boolean
  message: string
  data: FaqItem
}

export interface CreateFaqPayload {
  question: string
  ans: string
  role: string
}

export interface UpdateFaqPayload {
  id: string
  body: CreateFaqPayload
}

export const helpAndFaqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHelpAndFaqs: builder.query<FaqApiResponse, void>({
      query: () => '/faq',
      providesTags: ['Faqs'],
    }),
    createHelpAndFaq: builder.mutation<SingleFaqApiResponse, CreateFaqPayload>({
      query: (body) => ({
        url: '/faq',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Faqs'],
    }),
    updateHelpAndFaq: builder.mutation<SingleFaqApiResponse, UpdateFaqPayload>({
      query: ({ id, body }) => ({
        url: `/faq/${id}`,
        method: 'PATCH',
        body: body,
      }),
      invalidatesTags: ['Faqs'],
    }),
    deleteHelpAndFaq: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/faq/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Faqs'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetHelpAndFaqsQuery,
  useCreateHelpAndFaqMutation,
  useUpdateHelpAndFaqMutation,
  useDeleteHelpAndFaqMutation,
} = helpAndFaqApi

