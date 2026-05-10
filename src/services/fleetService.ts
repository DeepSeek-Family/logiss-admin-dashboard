import { vehicles as mockVehicles } from '../data/mockData';

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
  getVehicles: (): Promise<Vehicle[]> => Promise.resolve([...fleetDB]),

  getVehicleById: (id: string): Promise<Vehicle> => {
    const vehicle = fleetDB.find(v => v.id === id);
    if (!vehicle) return Promise.reject(new Error('Vehicle not found'));
    return Promise.resolve(vehicle);
  },

  updateVehicleStatus: (id: string, status: string): Promise<Vehicle> => {
    const index = fleetDB.findIndex(v => v.id === id);
    if (index === -1) return Promise.reject(new Error('Vehicle not found'));
    fleetDB[index] = { ...fleetDB[index], status };
    return Promise.resolve(fleetDB[index]);
  },

  addVehicle: (data: Partial<Vehicle>): Promise<Vehicle> => {
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
    const index = fleetDB.findIndex(v => v.id === vehicleId);
    if (index === -1) return Promise.reject(new Error('Vehicle not found'));
    fleetDB[index] = { ...fleetDB[index], assignedDriverId: driverId };
    return Promise.resolve(fleetDB[index]);
  }
};
