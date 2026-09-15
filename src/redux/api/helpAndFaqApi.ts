import { baseApi } from '../baseApi'
import type { Trip } from '../slice/tripsSlice'

export const helpAndFaqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHelpAndFaqs: builder.query<any[], void>({
      query: () => '/faq',
      providesTags: ['Faqs'],
    }),
   createHelpAndFaq: builder.mutation<any[], any>({
    query: (body) => ({
      url: '/faq',
      method: 'POST',
      body,
    }),
    invalidatesTags: ['Faqs'],
   }),
   updateHelpAndFaq: builder.mutation<any[], { id: string; body: any }>({
    query: ({id , body}) => ({
      url: `/faq/${id}`,
      method: 'PATCH',
      body: body,
      }),
      invalidatesTags: ['Faqs'],
    }),

  deleteHelpAndFaq: builder.mutation<any[], string>({
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
