import { useMemo, useCallback } from 'react';
import {
  useGetAllVehiclesQuery,
  useAddNewVehiclesMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useAssignVehicleDriverMutation,
  useUpdateVehicleAssignMutation,
} from '@/redux/api/vehiclesMangeApi';
import toast from 'react-hot-toast';
import { driverFullName, driverInitials } from '@/features/drivers/utils/helpers';
import { resolveMediaUrl } from '@/utils/imageUrl';
import { submitVehicleAssign } from '@/features/fleet/utils/submitVehicleAssign';

export const formatConfigurationType = (val: string): 'ambulatory_van' | 'wheelchair_van' | 'stretcher_van' => {
  if (!val) return 'wheelchair_van';
  const lower = val.toLowerCase().trim().replace(/\s+/g, '_');
  if (lower === 'ambulatory_van' || lower === 'wheelchair_van' || lower === 'stretcher_van') {
    return lower as any;
  }
  if (lower.includes('ambulatory')) return 'ambulatory_van';
  if (lower.includes('stretcher')) return 'stretcher_van';
  return 'wheelchair_van';
};

const displayTypeMap: Record<string, string> = {
  ambulatory_van: 'Ambulatory Van',
  wheelchair_van: 'Wheelchair Van',
  stretcher_van: 'Stretcher Van'
};

export const normalizeVehicle = (v: any) => {
  if (!v) return v;
  const id = v._id || v.id;
  const make = v.manufacturer || v.make || 'Ford';
  const model = v.model || 'Transit 350';
  const year = v.year || new Date().getFullYear();
  const plate = v.licensePlateNumber || v.plate || '---';
  
  const rawType = v.configurationType || v.type || 'wheelchair_van';
  const configurationType = formatConfigurationType(rawType);
  const type = displayTypeMap[configurationType] || rawType;

  const capacity = v.maxPassengers || v.capacity || v.seats || 4;
  const status = v.status || (v.isActive === false ? 'maintenance' : 'available');
  const vin = v.vinNumber || v.vin || 'N/A';
  const mileage = v.odometer || v.mileage || 0;
  const insurance = v.insurance || {
    provider: v.carrierProvider || 'State Farm',
    policyNumber: v.policyNumber || 'N/A',
    expires: v.insuranceExpirationDate ? String(v.insuranceExpirationDate).split('T')[0] : '2027-03-31',
    status: 'valid'
  };

  const driverRef =
    (typeof v.driver === 'object' && v.driver ? v.driver : null) ||
    (typeof v.driverId === 'object' && v.driverId ? v.driverId : null);

  const assignedDriverId =
    v.assignedDriverId ||
    (typeof v.driverId === 'string' ? v.driverId : null) ||
    driverRef?._id ||
    (typeof v.driver === 'string' ? v.driver : null);

  const formatServiceDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  const assignedDriver = driverRef
    ? {
        id: String(driverRef._id || ''),
        name: driverFullName(driverRef),
        phone: driverRef.contact || '',
        email: driverRef.email || '',
        initials: driverInitials(driverRef),
        image: resolveMediaUrl(driverRef.profile),
        onDuty: Boolean(driverRef.isOnDuty),
      }
    : null;

  return {
    ...v,
    id,
    _id: id,
    assignedDriverId,
    driverId: assignedDriverId,
    assignedDriver,
    assignedDriverName: assignedDriver?.name || '',
    driver: driverRef,
    make,
    manufacturer: make,
    model,
    year,
    plate,
    licensePlateNumber: plate,
    type,
    configurationType,
    capacity,
    maxPassengers: capacity,
    seats: capacity,
    status,
    vin,
    vinNumber: vin,
    mileage,
    odometer: mileage,
    insurance,
    carrierProvider: v.carrierProvider || insurance.provider,
    policyNumber: v.policyNumber || insurance.policyNumber,
    insuranceExpirationDate: v.insuranceExpirationDate || insurance.expires,
    nextService: v.nextService || formatServiceDate(v.nextServiceDate),
  };
};

export const useFleet = (params?: { searchTerm?: string; search?: string; [key: string]: any }) => {
  const queryParams = useMemo(() => {
    if (!params) return undefined;
    const term = params.searchTerm || params.search || '';
    return term ? { searchTerm: term } : undefined;
  }, [params]);

  const { data: apiResponse, isLoading, isError, error, refetch } = useGetAllVehiclesQuery(queryParams);
  const [addNewVehicles] = useAddNewVehiclesMutation();
  const [updateVehicleApi] = useUpdateVehicleMutation();
  const [deleteVehicleApi] = useDeleteVehicleMutation();
  const [assignVehicleDriver] = useAssignVehicleDriverMutation();
  const [updateVehicleAssign] = useUpdateVehicleAssignMutation();

  const vehicles = useMemo(() => {
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
      return apiResponse.data.map(normalizeVehicle);
    }
    return [];
  }, [apiResponse]);

  const addVehicle = useCallback(async (data: any) => {
    try {
      const payload = {
        manufacturer: data.make || data.manufacturer || 'Ford',
        model: data.model || 'Transit 350',
        year: Number(data.year) || 2024,
        licensePlateNumber: data.plate || data.licensePlateNumber || 'TX-4821-AB',
        vinNumber: data.vin || data.vinNumber || '1FTBW2XG5PKA12345',
        configurationType: formatConfigurationType(data.type || data.configurationType || 'wheelchair_van'),
        maxPassengers: Number(data.seats) || Number(data.maxPassengers) || 8,
        odometer: Number(data.mileage) || Number(data.odometer) || 25000,
        nextServiceDate: data.nextService ? new Date(data.nextService).toISOString() : new Date().toISOString(),
        carrierProvider: data.insuranceProvider || data.carrierProvider || 'State Farm',
        policyNumber: data.insurancePolicy || data.policyNumber || 'SF-INS-98451236',
        insuranceExpirationDate: data.insuranceExpiry ? new Date(data.insuranceExpiry).toISOString() : new Date().toISOString()
      };

      const result = await addNewVehicles(payload).unwrap();
      toast.success(result.message || 'Vehicle added successfully');
      refetch();
      return result;
    } catch (err: any) {
      console.warn('API addVehicle error or Zod error:', err);
      const errorMsg = err?.data?.message || err?.data?.errorMessages?.[0]?.message || err?.message;
      if (errorMsg) {
        toast.error(errorMsg);
      }
      throw err;
    }
  }, [addNewVehicles, refetch]);

  const handleAssign = useCallback(async (
    vehicleId: string,
    driverId: string,
    options?: { assignmentId?: string; patchDriverOnly?: boolean },
  ) => {
    const result = await submitVehicleAssign(
      {
        create: (body) => assignVehicleDriver(body).unwrap(),
        update: (args) => updateVehicleAssign(args).unwrap(),
      },
      {
        driverId,
        vehicleId,
        assignmentId: options?.assignmentId,
        patchDriverOnly: options?.patchDriverOnly,
      },
    );
    toast.success(result.message || 'Driver assigned to vehicle');
    const { data: refetched } = await refetch();
    const raw = refetched?.data?.find((v: { _id?: string; id?: string }) => (v._id || v.id) === vehicleId);
    if (raw) {
      return normalizeVehicle({ ...raw, driverId, assignedDriverId: driverId });
    }
    return normalizeVehicle({ id: vehicleId, _id: vehicleId, driverId, assignedDriverId: driverId });
  }, [assignVehicleDriver, updateVehicleAssign, refetch]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      await updateVehicleApi({ id, data: { isActive: status === 'available' } as any }).unwrap();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update vehicle status');
      throw err;
    }
  }, [updateVehicleApi, refetch]);

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      const result = await deleteVehicleApi(id).unwrap();
      toast.success(result.message || 'Vehicle deleted');
      refetch();
      return result;
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete vehicle');
    }
  }, [deleteVehicleApi, refetch]);

  return {
    vehicles,
    loading: isLoading,
    error: isError ? (error as any)?.message || 'Failed to fetch vehicles' : null,
    addVehicle,
    handleAssign,
    updateStatus,
    deleteVehicle,
    refresh: refetch
  };
};
