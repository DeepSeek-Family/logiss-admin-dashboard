import { trips as mockTrips } from '../data/mockData';

export interface Trip {
  id: string;
  status: string;
  driverId?: string;
  [key: string]: any; // For other properties in mockData
}

let tripsDB: Trip[] = [...mockTrips];

export const tripService = {
  getTrips: (filters: { status?: string } = {}): Promise<Trip[]> => {
    let result = [...tripsDB];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    return Promise.resolve(result);
  },

  getTripById: (id: string): Promise<Trip> => {
    const trip = tripsDB.find(t => t.id === id);
    if (!trip) return Promise.reject(new Error('Trip not found'));
    return Promise.resolve(trip);
  },

  updateTripStatus: (id: string, status: string): Promise<Trip> => {
    const index = tripsDB.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], status };
    return Promise.resolve(tripsDB[index]);
  },

  assignDriver: (tripId: string, driverId: string): Promise<Trip> => {
    const index = tripsDB.findIndex(t => t.id === tripId);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], driverId, status: 'assigned' };
    return Promise.resolve(tripsDB[index]);
  }
};
