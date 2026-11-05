import { baseApi } from "./baseApi";

// Feature modules inject their endpoints when their route is loaded. Keeping only
// the shared API here prevents every endpoint definition entering the startup chunk.
export const apis = [baseApi];
