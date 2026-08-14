import { vehicles as mockVehicles } from '../data/mockData';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { API } from '@/constants/api';

export interface Vehicle {
  id: string;
  type: string;
  plate: string;
  status: string;
  assignedDriverId?: string | null;
  maintenance?: any[];
  [key: string]: any;
}

let fleetDB: Vehicle[] = [...mockVehicles];

export const fleetService = {
  getVehicles: (): Promise<Vehicle[]> => {
    if (!env.useMock) return api.get<Vehicle[]>(API.fleet);
    return Promise.resolve([...fleetDB]);
  },

  getVehicleById: (id: string): Promise<Vehicle> => {
    if (!env.useMock) return api.get<Vehicle>(API.vehicle(id));
    const vehicle = fleetDB.find(v => v.id === id);
    if (!vehicle) return Promise.reject(new Error('Vehicle not found'));
    return Promise.resolve(vehicle);
  },

  updateVehicleStatus: (id: string, status: string): Promise<Vehicle> => {
    if (!env.useMock) return api.patch<Vehicle>(API.vehicle(id), { status });
    const index = fleetDB.findIndex(v => v.id === id);
    if (index === -1) return Promise.reject(new Error('Vehicle not found'));
    fleetDB[index] = { ...fleetDB[index], status };
    return Promise.resolve(fleetDB[index]);
  },

  addVehicle: (data: Partial<Vehicle>): Promise<Vehicle> => {
    if (!env.useMock) return api.post<Vehicle>(API.fleet, data);
    const newVehicle: Vehicle = {
      id: `VEH-00${fleetDB.length + 1}`,
      type: data.type || 'Unknown',
      plate: data.plate || '---',
      status: 'available',
      maintenance: [],
      ...data
    };
    fleetDB.unshift(newVehicle);
    return Promise.resolve(newVehicle);
  },

  assignDriver: (vehicleId: string, driverId: string | null): Promise<Vehicle> => {
    if (!env.useMock) return api.patch<Vehicle>(API.vehicle(vehicleId), { assignedDriverId: driverId });
    const index = fleetDB.findIndex(v => v.id === vehicleId);
    if (index === -1) return Promise.reject(new Error('Vehicle not found'));
    if (driverId) {
      fleetDB = fleetDB.map(v => v.assignedDriverId === driverId ? { ...v, assignedDriverId: null } : v);
    }
    fleetDB[index] = { ...fleetDB[index], assignedDriverId: driverId };
    return Promise.resolve(fleetDB[index]);
  }
};
