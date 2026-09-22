import type { IDriverUser } from '@/redux/api/driversApi'
import { mapDriverBase } from '@/features/drivers/utils/helpers'

export type ApplicationUiStatus = 'reviewing' | 'info_requested' | 'approved' | 'rejected'

export const mapApplicationUiStatus = (applicationStatus?: string): ApplicationUiStatus => {
  const status = String(applicationStatus || 'pending').toLowerCase()
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'info_requested') return 'info_requested'
  return 'reviewing'
}

export const mapApplicationStage = (applicationStatus?: string): number => {
  const status = String(applicationStatus || 'pending').toLowerCase()
  if (status === 'approved') return 4
  if (status === 'rejected') return 2
  return 2
}

export const mapApiDriverApplication = (driver: IDriverUser) => {
  const base = mapDriverBase(driver)
  const uiStatus = mapApplicationUiStatus(driver.applicationStatus)

  return {
    ...base,
    stage: mapApplicationStage(driver.applicationStatus),
    _status: uiStatus,
    status: driver.applicationStatus,
    submitted: driver.createdAt,
    experience: driver.driverData?.driverExperience || '—',
    certs: driver.driverData?.licenseNumber ? ['Licensed'] : [],
    vehicle: {
      make: '—',
      type: '—',
      plate: '—',
    },
    licenseImage: base.license.image,
  }
}

export type MappedDriverApplication = ReturnType<typeof mapApiDriverApplication>
