import type { IDriverUser } from '@/redux/api/driversApi'

export type ApiVehicleRecord = {
  _id?: string
  manufacturer?: string
  model?: string
  year?: number
  licensePlateNumber?: string
  vinNumber?: string
  configurationType?: string
  maxPassengers?: number
  odometer?: number
  nextServiceDate?: string
  carrierProvider?: string
  policyNumber?: string
  insuranceExpirationDate?: string
  isActive?: boolean
}

export const formatVehicleConfiguration = (val?: string): string => {
  if (!val) return '—'
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const mapApiVehicleToUi = (v: ApiVehicleRecord) => {
  const id = v._id || ''
  const manufacturer = v.manufacturer || ''
  const model = v.model || ''
  const displayName = [manufacturer, model].filter(Boolean).join(' ').trim() || 'Vehicle'

  return {
    id,
    make: displayName,
    name: displayName,
    manufacturer,
    model,
    plate: v.licensePlateNumber || '—',
    licensePlateNumber: v.licensePlateNumber || '—',
    type: formatVehicleConfiguration(v.configurationType),
    configurationType: v.configurationType,
    year: v.year,
    vin: v.vinNumber || '—',
    vinNumber: v.vinNumber,
    maxPassengers: v.maxPassengers,
    odometer: v.odometer,
    nextServiceDate: v.nextServiceDate,
    isActive: v.isActive,
  }
}

export type MappedUiVehicle = ReturnType<typeof mapApiVehicleToUi>

export const vehicleFromDriverAssign = (driver: IDriverUser): MappedUiVehicle | undefined => {
  const assign = driver.vehicleAssign
  if (!assign?.vehicleId || typeof assign.vehicleId === 'string') return undefined
  return mapApiVehicleToUi(assign.vehicleId)
}
