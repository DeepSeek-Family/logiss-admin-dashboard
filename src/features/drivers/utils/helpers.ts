import type { IDriverUser } from '@/redux/api/driversApi'
import { formatShortDate } from '@/utils/helpers'
import { isMongoId } from '@/features/bookings/utils/helpers'
import { resolveMediaUrl } from '@/utils/imageUrl'

export const driverFullName = (driver?: Pick<IDriverUser, 'firstName' | 'middleName' | 'lastName'> | null): string => {
  if (!driver) return ''
  return [driver.firstName, driver.middleName, driver.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export const driverInitials = (driver?: Pick<IDriverUser, 'firstName' | 'lastName'> | null): string => {
  if (!driver) return 'D'
  return `${driver.firstName?.[0] || ''}${driver.lastName?.[0] || ''}`.toUpperCase() || 'D'
}

const firstMediaPath = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim())
    return typeof first === 'string' ? first : undefined
  }
  return undefined
}

const licenseBlock = (driver: IDriverUser) => ({
  number: driver.driverData?.licenseNumber || '—',
  class: driver.driverData?.licenseClass ? `Class ${driver.driverData.licenseClass}` : '—',
  expires: driver.driverData?.expirationDate ? formatShortDate(driver.driverData.expirationDate) : '—',
  image: resolveMediaUrl(firstMediaPath(driver.driverData?.licenseImage)),
})

export const mapDriverBase = (driver: IDriverUser) => {
  const id = driver._id || driver.id || ''
  const countyRaw = driver.county ? String(driver.county) : ''

  return {
    id,
    _id: id,
    name: driverFullName(driver) || 'Driver',
    firstName: driver.firstName,
    middleName: driver.middleName,
    lastName: driver.lastName,
    initials: driverInitials(driver),
    email: driver.email || '',
    phone: driver.contact || '',
    contact: driver.contact || '',
    image: resolveMediaUrl(driver.profile),
    profile: driver.profile,
    authorizationId: driver.authorizationID || '',
    county: countyRaw && !isMongoId(countyRaw) ? countyRaw : '',
    countyId: countyRaw,
    verified: Boolean(driver.verified),
    isBanned: Boolean(driver.isBanned),
    applicationStatus: driver.applicationStatus,
    createdAt: driver.createdAt,
    joinedDate: driver.createdAt,
    license: licenseBlock(driver),
    experience: driver.driverData?.driverExperience || '—',
  }
}

export const mapApiDriver = (driver: IDriverUser) => {
  const base = mapDriverBase(driver)
  const appStatus = String(driver.applicationStatus || '').toLowerCase()
  const onDuty = Boolean(driver.isOnDuty)

  let status = 'off_duty'
  if (onDuty) status = 'available'
  else if (appStatus === 'pending') status = 'off_duty'

  return {
    ...base,
    onDuty,
    status,
    totalTrips: driver.trip ?? 0,
    tripsToday: 0,
    rating: undefined as number | undefined,
    pendingDocUpdates: appStatus === 'pending' && !driver.isAdminVerifiedDriver ? 1 : 0,
    vehicle: undefined as { make?: string; plate?: string; type?: string } | undefined,
  }
}

export type MappedDriver = ReturnType<typeof mapApiDriver>
