import { baseApi } from "../baseApi";
import { RESET_PASSWORD_TOKEN_KEY } from "@/constants/auth-storage";

export interface LoginRequest {
  email: string;
  password: string;
  fcmToken?: string;
  deviceToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?:
    | string
    | {
        accessToken?: string;
        refreshToken?: string;
        token?: string;
        access_token?: string;
        refresh_token?: string;
        user?: { role?: string; [key: string]: unknown };
        role?: string;
        data?: {
          accessToken?: string;
          token?: string;
          access_token?: string;
          refreshToken?: string;
          user?: { role?: string; [key: string]: unknown };
        };
        [key: string]: unknown;
      };
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: { role?: string; [key: string]: unknown };
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface VerifyEmailRequest {
  email: string;
  oneTimeCode: number | string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => {
        const fcmToken = credentials.fcmToken?.trim() || "";
        const deviceToken = credentials.deviceToken?.trim() || "";
        const body: LoginRequest = {
          email: credentials.email,
          password: credentials.password,
        };
        if (fcmToken) body.fcmToken = fcmToken;
        if (deviceToken) body.deviceToken = deviceToken;
        return {
          url: "/auth/login",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Auth", "Profile", "User"],
    }),

    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resendOtp: builder.mutation<ResendOtpResponse, ResendOtpRequest>({
      query: (body) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body,
      }),
    }),

    verifyEmail: builder.mutation<VerifyEmailResponse, VerifyEmailRequest>({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: {
          email: body.email.trim(),
          oneTimeCode: Number(body.oneTimeCode),
        },
      }),
    }),

    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: (body) => {
        const resetToken =
          typeof localStorage !== "undefined"
            ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
            : null;
        return {
          url: "/auth/reset-password",
          method: "POST",
          body: {
            newPassword: body.newPassword,
            confirmPassword: body.confirmPassword,
          },
          headers: resetToken
            ? {
                Authorization: resetToken,
                authorization: resetToken,
                resettoken: resetToken,
              }
            : undefined,
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResendOtpMutation,
  useVerifyEmailMutation,
  useResetPasswordMutation,
} = authApi;
