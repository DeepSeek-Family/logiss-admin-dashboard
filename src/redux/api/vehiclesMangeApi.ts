import { baseApi } from "../baseApi";

export interface Vehicle {
  _id: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlateNumber: string;
  vinNumber: string;
  configurationType: string;
  maxPassengers: number;
  odometer: number;
  nextServiceDate: string;
  carrierProvider: string;
  policyNumber: string;
  insuranceExpirationDate: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type CreateVehicleRequest = Omit<
  Vehicle,
  "_id" | "isActive" | "createdAt" | "updatedAt" | "__v"
>;

export interface VehiclesListResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
}

export interface SingleVehicleResponse {
  success: boolean;
  message: string;
  data: Vehicle;
}

const vehicleManageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addNewVehicles: builder.mutation<SingleVehicleResponse, CreateVehicleRequest>({
      query: (data) => ({
        url: "/vehicle",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vehicles"],
    }),
    getAllVehicles: builder.query<VehiclesListResponse, Record<string, any> | void>({
      query: (params) => ({
        url: "/vehicle",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Vehicles"],
    }),
    getVehicleById: builder.query<SingleVehicleResponse, string>({
      query: (id) => `/vehicle/${id}`,
      providesTags: ["Vehicles"],
    }),
    updateVehicle: builder.mutation<
      SingleVehicleResponse,
      { id: string; data: Partial<CreateVehicleRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/vehicle/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Vehicles"],
    }),
    deleteVehicle: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/vehicle/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vehicles"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddNewVehiclesMutation,
  useGetAllVehiclesQuery,
  useGetVehicleByIdQuery,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehicleManageApi;