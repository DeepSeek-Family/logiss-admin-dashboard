import { baseApi } from "../baseApi";
import type { IRider } from "./ridersApi";

export interface IUserDetail extends IRider {
  totalRiderAmount?: number;
  totalOrganizationAmount?: number;
  totalAmount?: number;
  isPushNotificationEnabled?: boolean;
}

export interface IAuthUserDetailResponse {
  success: boolean;
  message?: string;
  data: IUserDetail;
}

export interface ICurrentUserProfile {
  _id?: string;
  id?: string;
  userId?: string;
  employeeId?: string;
  employeeID?: string;
  staffId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  contact?: string;
  role?: string;
  profile?: string;
  image?: string;
  avatar?: string;
  region?: string;
  reportingRegion?: string;
  department?: string;
  [key: string]: unknown;
}

export interface ICurrentUserProfileResponse {
  success: boolean;
  message?: string;
  data: ICurrentUserProfile;
}

export interface IUpdateCurrentUserProfileInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  contact: string;
  region: string;
  image?: File;
}

const normalizeCurrentUserProfile = (response: unknown): ICurrentUserProfileResponse => {
  const body = response as Record<string, unknown> | null | undefined;
  const data = (body?.data ?? body) as ICurrentUserProfile;
  return {
    success: body?.success !== false,
    message: body?.message as string | undefined,
    data,
  };
};

const normalizeAuthUserDetail = (response: unknown): IAuthUserDetailResponse => {
  const body = response as Record<string, unknown> | null | undefined;
  const data = (body?.data ?? body) as IUserDetail;
  return {
    success: body?.success !== false,
    message: body?.message as string | undefined,
    data,
  };
};

export interface IBannedUser {
  _id: string;
  id?: string;
  isBanned?: boolean;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface IToggleUserBannedResponse {
  success: boolean;
  message?: string;
  data?: IBannedUser;
}

const unwrapBannedUser = (response: unknown): IBannedUser | undefined => {
  const raw = (response as { data?: unknown })?.data ?? response;
  if (raw && typeof raw === "object" && ("_id" in raw || "id" in raw)) {
    return raw as IBannedUser;
  }
  return undefined;
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUserProfile: builder.query<ICurrentUserProfileResponse, void>({
      query: () => ({
        url: "/user/profile",
        method: "GET",
      }),
      transformResponse: normalizeCurrentUserProfile,
      providesTags: [{ type: "User", id: "PROFILE" }],
    }),
    updateCurrentUserProfile: builder.mutation<
      ICurrentUserProfileResponse,
      IUpdateCurrentUserProfileInput
    >({
      query: ({ image, ...fields }) => {
        if (!image) {
          return {
            url: "/user",
            method: "PATCH",
            body: fields,
          };
        }

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
        formData.append("image", image);
        return {
          url: "/user",
          method: "PATCH",
          body: formData,
        };
      },
      transformResponse: normalizeCurrentUserProfile,
      invalidatesTags: [{ type: "User" }],
    }),
    getAuthUserById: builder.query<IAuthUserDetailResponse, string>({
      query: (id) => ({
        url: `/auth/user/${id}`,
        method: "GET",
      }),
      transformResponse: normalizeAuthUserDetail,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    toggleUserBanned: builder.mutation<IToggleUserBannedResponse, string>({
      query: (id) => ({
        url: `/user/banned/${id}`,
        method: "PATCH",
      }),
      transformResponse: (response: unknown): IToggleUserBannedResponse => ({
        success: (response as { success?: boolean })?.success !== false,
        message: (response as { message?: string })?.message,
        data: unwrapBannedUser(response),
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "Riders", id },
        { type: "Riders", id: "LIST" },
        { type: "Drivers", id },
        { type: "Drivers", id: "LIST" },
        { type: "Applications", id },
        { type: "Applications", id: "LIST" },
        { type: "Dispatchers", id },
        { type: "Dispatchers", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentUserProfileQuery,
  useUpdateCurrentUserProfileMutation,
  useGetAuthUserByIdQuery,
  useToggleUserBannedMutation,
} = userApi;
