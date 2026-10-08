import type { IDriverUser } from '@/redux/api/driversApi'
import { mapDriverBase } from '@/features/drivers/utils/helpers'
import { resolveMediaUrl } from '@/utils/imageUrl'

export type ApplicationUiStatus = 'reviewing' | 'info_requested' | 'approved' | 'rejected'

const displayDate = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const licenseImageUrls = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : typeof value === 'string' && value.trim() ? [value] : []
  return list
    .map((item) => (typeof item === 'string' ? resolveMediaUrl(item) : undefined))
    .filter((url): url is string => Boolean(url))
}

export const mapApplicationStage = (applicationStatus?: string): number => {
  const status = String(applicationStatus || 'pending').toLowerCase()
  if (status === 'approved') return 4
  return 2
}

export const mapApplicationUiStatus = (applicationStatus?: string): ApplicationUiStatus => {
  const status = String(applicationStatus || 'pending').toLowerCase()
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'info_requested') return 'info_requested'
  return 'reviewing'
}

export const mapApiDriverApplication = (driver: IDriverUser) => {
  const base = mapDriverBase(driver)
  const images = licenseImageUrls(driver.driverData?.licenseImage)

  return {
    ...base,
    status: String(driver.applicationStatus || 'pending').toLowerCase(),
    stage: mapApplicationStage(driver.applicationStatus),
    _status: mapApplicationUiStatus(driver.applicationStatus),
    submitted: displayDate(driver.createdAt),
    dob: displayDate(driver.dateOfBirth),
    experience: driver.driverData?.driverExperience?.trim() || '',
    licenseNumber: driver.driverData?.licenseNumber?.trim() || '',
    licenseClass: driver.driverData?.licenseClass?.trim() || '',
    licenseExpires: displayDate(driver.driverData?.expirationDate),
    licenseImages: images,
    isAdminVerified: Boolean(driver.isAdminVerifiedDriver),
    isOnDuty: Boolean(driver.isOnDuty),
    trips: driver.trip ?? 0,
    role: driver.role || '',
  }
}

export type MappedDriverApplication = ReturnType<typeof mapApiDriverApplication>
