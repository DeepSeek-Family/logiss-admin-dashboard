import { baseApi } from '../baseApi'

export interface ICompanySupport {
  _id: string
  supportEmail?: string
  helplineNumber?: string
  dispatcherDirectLine?: string
  emergencyHotline?: string
  generalOfficeLine?: string
  organizationName?: string
  headquartersAddress?: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface ICompanySupportBody {
  supportEmail: string
  helplineNumber: string
  dispatcherDirectLine: string
  emergencyHotline: string
  generalOfficeLine: string
  organizationName: string
  headquartersAddress: string
}

export interface ICompanySupportResponse {
  success: boolean
  message?: string
  data: ICompanySupport
}

const normalizeCompanySupportResponse = (response: unknown): ICompanySupportResponse => {
  const r = response as Record<string, unknown>
  const data = (r?.data ?? r) as ICompanySupport
  return {
    success: r?.success !== false,
    message: typeof r?.message === 'string' ? r.message : undefined,
    data,
  }
}

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanySupport: builder.query<ICompanySupportResponse, void>({
      query: () => ({
        url: '/company-support',
        method: 'GET',
      }),
      transformResponse: normalizeCompanySupportResponse,
      providesTags: (result) =>
        result?.data?._id
          ? [
              { type: 'CompanySupport' as const, id: result.data._id },
              { type: 'CompanySupport', id: 'DETAIL' },
            ]
          : [{ type: 'CompanySupport', id: 'DETAIL' }],
    }),
    /** Create and update both use POST — no id in URL. */
    saveCompanySupport: builder.mutation<ICompanySupportResponse, ICompanySupportBody>({
      query: (body) => ({
        url: '/company-support',
        method: 'POST',
        body,
      }),
      transformResponse: normalizeCompanySupportResponse,
      invalidatesTags: [{ type: 'CompanySupport', id: 'DETAIL' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCompanySupportQuery,
  useSaveCompanySupportMutation,
} = supportApi
