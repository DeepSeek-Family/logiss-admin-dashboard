import { trips as mockTrips } from '../data/mockData';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { API } from '@/constants/api';

export interface Trip {
  id: string;
  status: string;
  driverId?: string;
  [key: string]: any;
}

let tripsDB: Trip[] = [...mockTrips];

export const tripService = {
  getTrips: (filters: { status?: string } = {}): Promise<Trip[]> => {
    if (!env.useMock) {
      return api.get<Trip[]>(API.trips, { status: filters.status });
    }
    let result = [...tripsDB];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    return Promise.resolve(result);
  },

  getTripById: (id: string): Promise<Trip> => {
    if (!env.useMock) return api.get<Trip>(API.trip(id));
    const trip = tripsDB.find(t => t.id === id);
    if (!trip) return Promise.reject(new Error('Trip not found'));
    return Promise.resolve(trip);
  },

  updateTripStatus: (id: string, status: string): Promise<Trip> => {
    if (!env.useMock) return api.patch<Trip>(API.tripStatus(id), { status });
    const index = tripsDB.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], status };
    return Promise.resolve(tripsDB[index]);
  },

  updateTrip: (id: string, patch: Partial<Trip>): Promise<Trip> => {
    if (!env.useMock) return api.patch<Trip>(API.trip(id), patch);
    const index = tripsDB.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], ...patch };
    return Promise.resolve(tripsDB[index]);
  },

  assignDriver: (tripId: string, driverId: string): Promise<Trip> => {
    if (!env.useMock) return api.post<Trip>(API.tripAssign(tripId), { driverId });
    const index = tripsDB.findIndex(t => t.id === tripId);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], driverId, status: 'assigned' };
    return Promise.resolve(tripsDB[index]);
  },

  createTrip: (trip: Trip): Promise<Trip> => {
    if (!env.useMock) return api.post<Trip>(API.trips, trip);
    tripsDB = [trip, ...tripsDB];
    return Promise.resolve(trip);
  }
};
