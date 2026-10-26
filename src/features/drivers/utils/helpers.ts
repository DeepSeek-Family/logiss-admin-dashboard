import type { IDriverUser } from '@/redux/api/driversApi'
import { formatShortDate } from '@/utils/helpers'
import { isMongoId } from '@/features/bookings/utils/helpers'
import { imageUrl, resolveMediaUrl } from '@/utils/imageUrl'

export const driverFullName = (driver?: Pick<IDriverUser, 'firstName' | 'middleName' | 'lastName'> | null): string => {
  if (!driver) return ''
  return [driver.firstName, driver.middleName, driver.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export const driverInitials = (driver?: Pick<IDriverUser, 'firstName' | 'lastName'> | null): string => {
  if (!driver) return 'D'
  return `${driver.firstName?.[0] || ''}${driver.lastName?.[0] || ''}`.toUpperCase() || 'D'
}

export const mediaPaths = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : typeof value === 'string' && value.trim() ? [value] : []
  return list.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

export const resolveLicenseImageUrls = (value: unknown): string[] =>
  mediaPaths(value).map((path) => {
    const resolved = resolveMediaUrl(path) || imageUrl(path)
    if (resolved) return resolved
    return path.startsWith('/') ? path : `/${path}`
  })

const displayDate = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

const licenseBlock = (driver: IDriverUser) => {
  const paths = mediaPaths(driver.driverData?.licenseImage)
  const images = resolveLicenseImageUrls(paths)
  return {
    number: driver.driverData?.licenseNumber || '',
    class: driver.driverData?.licenseClass ? `Class ${driver.driverData.licenseClass}` : '',
    expires: driver.driverData?.expirationDate ? formatShortDate(driver.driverData.expirationDate) : '',
    image: images[0],
    images,
  }
}

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
    dob: displayDate(driver.dateOfBirth),
    role: driver.role || '',
    applicationStatus: driver.applicationStatus || '',
    isAdminVerified: Boolean(driver.isAdminVerifiedDriver),
    isOnDuty: Boolean(driver.isOnDuty),
    createdAt: driver.createdAt,
    joinedDate: displayDate(driver.createdAt),
    license: licenseBlock(driver),
    licenseImagePaths: mediaPaths(driver.driverData?.licenseImage),
    licenseImages: resolveLicenseImageUrls(driver.driverData?.licenseImage),
    experience: driver.driverData?.driverExperience || '',
  }
}

export const mapApiDriver = (driver: IDriverUser) => {
  const base = mapDriverBase(driver)
  const appStatus = String(driver.applicationStatus || '').toLowerCase()
  const onDuty = Boolean(driver.isOnDuty)

  let status = 'off_duty'
  if (driver.isBanned) status = 'banned'
  else if (onDuty) status = 'available'
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
