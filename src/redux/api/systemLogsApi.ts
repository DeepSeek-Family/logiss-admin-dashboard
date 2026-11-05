import { baseApi } from "../baseApi";

export type SystemLogAction = "CREATE" | "UPDATE" | "DELETE" | string;
export type SystemLogActorRole = "SUPER_ADMIN" | "DISPATCHER" | string;

export interface SystemLogChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface SystemLogActor {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  role?: SystemLogActorRole;
}

export interface SystemLog {
  _id: string;
  actorId: SystemLogActor | string | null;
  actorRole: SystemLogActorRole;
  actorEmail?: string;
  action: SystemLogAction;
  module: string;
  entityType: string;
  entityId: string;
  description: string;
  changes: SystemLogChange[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLogsQueryParams {
  page: number;
  limit: number;
  module?: string;
  actorRole?: string;
  action?: string;
  entityId?: string;
}

export interface SystemLogsResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPage: number;
  };
  data: SystemLog[];
}

const normalizeSystemLogsResponse = (response: unknown): SystemLogsResponse => {
  const payload = (response || {}) as Partial<SystemLogsResponse>;
  const pagination = payload.pagination || {
    total: 0,
    limit: 20,
    page: 1,
    totalPage: 1,
  };
  return {
    success: payload.success !== false,
    statusCode: payload.statusCode,
    message: typeof payload.message === "string" ? payload.message : "",
    pagination: {
      total: Number(pagination.total) || 0,
      limit: Number(pagination.limit) || 20,
      page: Number(pagination.page) || 1,
      totalPage: Math.max(1, Number(pagination.totalPage) || 1),
    },
    data: Array.isArray(payload.data)
      ? payload.data.filter((log): log is SystemLog =>
          Boolean(log && typeof log === "object" && log._id),
        )
      : [],
  };
};

export const systemLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSystemLogs: builder.query<SystemLogsResponse, SystemLogsQueryParams>({
      query: ({ page, limit, module, actorRole, action, entityId }) => {
        const params: Record<string, string | number> = { page, limit };
        if (module) params.module = module;
        if (actorRole) params.actorRole = actorRole;
        if (action) params.action = action;
        if (entityId) params.entityId = entityId;
        return {
          url: "/system-logs",
          method: "GET",
          params,
        };
      },
      transformResponse: normalizeSystemLogsResponse,
    }),
  }),
  overrideExisting: false,
});

export const { useGetSystemLogsQuery } = systemLogsApi;
