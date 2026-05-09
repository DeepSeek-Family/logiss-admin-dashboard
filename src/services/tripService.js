import { trips as mockTrips } from '../data/mockData';

let tripsDB = [...mockTrips];

export const tripService = {
  getTrips: (filters = {}) => {
    let result = [...tripsDB];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    return Promise.resolve(result);
  },

  getTripById: (id) => {
    const trip = tripsDB.find(t => t.id === id);
    if (!trip) return Promise.reject(new Error('Trip not found'));
    return Promise.resolve(trip);
  },

  updateTrip(id, updates) {
    const index = tripsDB.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], ...updates };
    return Promise.resolve(tripsDB[index]);
  },

  updateTripStatus: (id, status) => {
    const index = tripsDB.findIndex(t => t.id === id);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], status };
    return Promise.resolve(tripsDB[index]);
  },

  assignDriver: (tripId, driverId) => {
    const index = tripsDB.findIndex(t => t.id === tripId);
    if (index === -1) return Promise.reject(new Error('Trip not found'));
    tripsDB[index] = { ...tripsDB[index], driverId, status: 'assigned' };
    return Promise.resolve(tripsDB[index]);
  }
};
