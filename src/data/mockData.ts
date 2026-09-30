// Facilities & Programs registry — managed in CMS, used by Facility User assignment,
// booking form program/source, etc. (single source of truth seed).
export const FACILITY_PROGRAMS = [
  { id: 1, name: 'Chippenham Medical Center', type: 'Hospital', active: true },
  { id: 2, name: 'Memorial Regional Medical Center', type: 'Hospital', active: true },
  { id: 3, name: 'Johnston-Willis Hospital', type: 'Hospital', active: true },
  { id: 4, name: 'VCU Medical Center', type: 'Hospital', active: true },
  { id: 5, name: 'Richmond Dental Specialists', type: 'Clinic', active: true },
  { id: 6, name: 'Bon Secours St. Mary’s', type: 'Hospital', active: true },
  { id: 7, name: 'Chesterfield Adult Day Care', type: 'Program', active: true },
  { id: 8, name: 'Hanover Nursing & Rehab', type: 'Nursing Home', active: true },
];

export const willCallQueue = [
  { tripId: 'LOGISS-2840', rider: 'Dorothy Phillips', driverId: 'DRV-2024-8421',
    pickupLocation: "St. Mary's Hospital", pickupTime: '8:15 AM',
    returnAddress: '5421 Patterson Ave Richmond' }
];

export const opsStats = {
  todaysTrips: 23, inProgress: 1, pendingReview: 3, driversOnDuty: 4, driversTotal: 5,
  completionRate: 96, avgRating: 4.83, willCallStandby: 1, expiringDocuments: 2
};
