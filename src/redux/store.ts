import { configureStore, isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import toast from "react-hot-toast";
import { apis } from "@/redux/apis";
import { reducers } from "@/redux/reducers";
import { getUserFacingApiError } from "@/utils/apiError";

/**
 * Global RTK Query error middleware:
 * Catches unhandled network errors, 5xx server errors, rate limits, and timeouts.
 */
const rtkQueryErrorLogger: Middleware = () => (next) => (action: any) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload;
    const status = payload?.status;
    const endpointName = action.meta?.arg?.endpointName;

    // Skip auth endpoints so LoginPage / recovery forms can handle their own messages
    const authEndpointNames = [
      "login",
      "forgotPassword",
      "resendOtp",
      "verifyEmail",
      "resetPassword",
    ];
    if (endpointName && authEndpointNames.includes(endpointName)) {
      return next(action);
    }

    // 401 & 403 are handled by baseQueryWithAuthHandling / authSession (logout & redirect)
    if (status === 401 || status === 403) {
      return next(action);
    }

    if (
      status === "FETCH_ERROR" ||
      status === "TIMEOUT_ERROR" ||
      status === 429 ||
      (typeof status === "number" && status >= 500)
    ) {
      toast.error(getUserFacingApiError(payload), {
        id: `api-error-${String(status)}`,
      });
    }
  }

  return next(action);
};

const apiReducers = Object.fromEntries(apis.map((api) => [api.reducerPath, api.reducer]));

const apiMiddleware = apis.map((api) => api.middleware) as Middleware[];

export const store = configureStore({
  reducer: {
    ...reducers,
    ...apiReducers,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddleware, rtkQueryErrorLogger),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
