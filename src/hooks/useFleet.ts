import { useState, useEffect, useCallback } from 'react';
import { Vehicle, fleetService } from '../services/fleetService';

export const useFleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fleetService.getVehicles();
      setVehicles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async (data: Partial<Vehicle>) => {
    try {
      const newV = await fleetService.addVehicle(data);
      setVehicles((prev: Vehicle[]) => [newV, ...prev]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssign = async (vehicleId: string, driverId: string | null) => {
    try {
      const updatedVehicle = await fleetService.assignDriver(vehicleId, driverId);
      setVehicles((prev: Vehicle[]) => prev.map((v: Vehicle) => {
        if (v.id === vehicleId) {
          return updatedVehicle;
        }

        if (driverId && v.assignedDriverId === driverId) {
          return { ...v, assignedDriverId: null };
        }

        return v;
      }));
      return updatedVehicle;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fleetService.updateVehicleStatus(id, status);
      setVehicles((prev: Vehicle[]) => prev.map((v: Vehicle) => v.id === id ? { ...v, status } : v));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { vehicles, loading, error, addVehicle, handleAssign, updateStatus, refresh: fetchVehicles };
};
