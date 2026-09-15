import { baseApi } from '../baseApi'

export type RuleType = 'privacy' | 'terms' | 'about' | string

export interface IRuleData {
  _id: string
  content: string
  type: RuleType
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface IRuleApiResponse {
  success: boolean
  message: string
  data: IRuleData
}

export interface IUpdateRulePayload {
  content: string
  type: RuleType
}

export const rulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRuleByType: builder.query<IRuleApiResponse, RuleType>({
      query: (type) => ({
        url: `/rule/${type}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, type) => [{ type: 'rules', id: type }, 'rules'],
    }),
    getAllRules: builder.query<IRuleApiResponse, void>({
      query: () => ({
        url: '/rule',
        method: 'GET',
      }),
      providesTags: ['rules'],
    }),
    updateRule: builder.mutation<IRuleApiResponse, IUpdateRulePayload>({
      query: (data) => ({
        url: '/rule',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'rules', id: arg.type }, 'rules'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetRuleByTypeQuery,
  useGetAllRulesQuery,
  useUpdateRuleMutation,
} = rulesApi