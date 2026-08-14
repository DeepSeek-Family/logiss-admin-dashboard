import { drivers as mockDrivers } from '../data/mockData';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { API } from '@/constants/api';

export interface Driver {
  id: string;
  name: string;
  status: string;
  onDuty: boolean;
  rating: number;
  totalTrips: number;
  joinedDate: string;
  vehicle?: any;
  [key: string]: any;
}

let driversDB: Driver[] = [...mockDrivers];

export const driverService = {
  getDrivers: (filters: { status?: string } = {}): Promise<Driver[]> => {
    if (!env.useMock) return api.get<Driver[]>(API.drivers, { status: filters.status });
    let result = [...driversDB];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(d => d.status === filters.status);
    }
    return Promise.resolve(result);
  },

  getDriverById: (id: string): Promise<Driver> => {
    if (!env.useMock) return api.get<Driver>(API.driver(id));
    const driver = driversDB.find(d => d.id === id);
    if (!driver) return Promise.reject(new Error('Driver not found'));
    return Promise.resolve(driver);
  },

  createDriver: (driverData: Partial<Driver>): Promise<Driver> => {
    if (!env.useMock) return api.post<Driver>(API.drivers, driverData);
    const newDriver: Driver = {
      id: `DRV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: driverData.name || 'Unknown',
      status: 'pending',
      onDuty: false,
      rating: 0,
      totalTrips: 0,
      joinedDate: new Date().toISOString(),
      ...driverData
    };
    driversDB = [newDriver, ...driversDB];
    return Promise.resolve(newDriver);
  },

  updateDriver: (id: string, updates: Partial<Driver>): Promise<Driver> => {
    if (!env.useMock) return api.patch<Driver>(API.driver(id), updates);
    const index = driversDB.findIndex(d => d.id === id);
    if (index === -1) return Promise.reject(new Error('Driver not found'));
    driversDB[index] = { ...driversDB[index], ...updates };
    return Promise.resolve(driversDB[index]);
  }
};
