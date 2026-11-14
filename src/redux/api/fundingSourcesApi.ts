import { baseApi } from "../baseApi";
import type { FundingSourceOrgType } from "@/features/fundingSourceSetup/buildContractFormData";

export interface IFundingSource {
  _id: string;
  name: string;
  type: FundingSourceOrgType;
  programName?: string;
  description?: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  defaultCountyId?: string | null;
  status?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IFundingSourceBody {
  name: string;
  type: FundingSourceOrgType;
  programName?: string;
  description?: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  defaultCountyId?: string | null;
  status?: boolean;
}

export interface IFundingSourcesResponse {
  success: boolean;
  message?: string;
  data: IFundingSource[];
}

export interface IFundingSourceMutationResponse {
  success: boolean;
  message?: string;
  data?: IFundingSource;
}

const normalizeList = <T>(response: unknown): T[] =>
  Array.isArray(response)
    ? response
    : Array.isArray((response as { data?: unknown })?.data)
      ? ((response as { data: T[] }).data)
      : [];

const unwrapOne = (response: unknown): IFundingSource | undefined => {
  const raw = (response as { data?: unknown })?.data ?? response;
  if (raw && typeof raw === "object" && "_id" in (raw as object)) {
    return raw as IFundingSource;
  }
  return undefined;
};

export const fundingSourcesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFundingSources: builder.query<IFundingSourcesResponse, void>({
      query: () => ({ url: "/funding-sources", method: "GET" }),
      transformResponse: (response: any): IFundingSourcesResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: normalizeList<IFundingSource>(response),
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "FundingSources" as const, id: _id })),
              { type: "FundingSources", id: "LIST" },
            ]
          : [{ type: "FundingSources", id: "LIST" }],
    }),
    createFundingSource: builder.mutation<IFundingSourceMutationResponse, IFundingSourceBody>({
      query: (body) => ({
        url: "/funding-sources",
        method: "POST",
        body,
      }),
      transformResponse: (response: any): IFundingSourceMutationResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: unwrapOne(response),
      }),
      invalidatesTags: [{ type: "FundingSources", id: "LIST" }],
    }),
    updateFundingSource: builder.mutation<
      IFundingSourceMutationResponse,
      { id: string; body: Partial<IFundingSourceBody> }
    >({
      query: ({ id, body }) => ({
        url: `/funding-sources/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any): IFundingSourceMutationResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: unwrapOne(response),
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "FundingSources", id: arg.id },
        { type: "FundingSources", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFundingSourcesQuery,
  useCreateFundingSourceMutation,
  useUpdateFundingSourceMutation,
} = fundingSourcesApi;
