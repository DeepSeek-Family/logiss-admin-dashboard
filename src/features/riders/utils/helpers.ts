import type { IRider } from '@/redux/api/ridersApi'
import { isMongoId } from '@/features/bookings/utils/helpers'
import { resolveMediaUrl } from '@/utils/imageUrl'

export const riderFullName = (rider?: Pick<IRider, 'firstName' | 'middleName' | 'lastName'> | null): string => {
  if (!rider) return ''
  return [rider.firstName, rider.middleName, rider.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export const riderInitials = (rider?: Pick<IRider, 'firstName' | 'lastName'> | null): string => {
  if (!rider) return 'R'
  return `${rider.firstName?.[0] || ''}${rider.lastName?.[0] || ''}`.toUpperCase() || 'R'
}

export const mapRiderStatus = (rider: IRider): string => {
  if (rider.isBanned) return 'banned'
  const app = String(rider.applicationStatus || '').toLowerCase()
  if (app === 'suspended') return 'suspended'
  if (app === 'banned') return 'banned'
  if (rider.verified || app === 'approved' || app === 'active') return 'active'
  return 'inactive'
}

export const displayDob = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export const formatRiderCurrency = (value?: number | null): string => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
}

export const calculateAge = (iso?: string | null): number | null => {
  if (!iso) return null
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const m = today.getUTCMonth() - dob.getUTCMonth()
  if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export const mapApiRider = (rider: IRider) => {
  const id = rider._id || rider.id || ''
  const name = riderFullName(rider) || 'Rider'

  let payerName = ''
  let countyName = ''
  let countyId = ''

  if (rider.county && typeof rider.county === 'object') {
    countyId = rider.county._id || ''
    if (rider.county.name) {
      countyName = rider.county.name
    }
    const payersId = rider.county.payersId
    if (payersId && typeof payersId === 'object') {
      payerName = payersId.name || ''
    } else if (typeof payersId === 'string' && !isMongoId(payersId)) {
      payerName = payersId
    }
  } else if (typeof rider.county === 'string') {
    countyId = rider.county
    if (!isMongoId(rider.county)) {
      countyName = rider.county
    }
  }

  const countyDisplay = payerName || countyName || ''

  return {
    id,
    _id: id,
    name,
    firstName: rider.firstName,
    middleName: rider.middleName,
    lastName: rider.lastName,
    initials: riderInitials(rider),
    email: rider.email || '',
    phone: rider.contact || '',
    contact: rider.contact || '',
    image: resolveMediaUrl(rider.profile),
    profile: rider.profile,
    passengerId: id,
    authorizationId: rider.authorizationID || '',
    authId: rider.authorizationID || '',
    county: countyDisplay,
    countyId,
    countyName,
    payerName,
    source: '',
    program: '',
    mobility: '',
    totalTrips: rider.trip ?? 0,
    totalRiderAmount: rider.totalRiderAmount,
    totalOrganizationAmount: rider.totalOrganizationAmount,
    totalAmount: rider.totalAmount,
    isPushNotificationEnabled: rider.isPushNotificationEnabled,
    rating: undefined as number | undefined,
    status: mapRiderStatus(rider),
    rawStatus: rider.applicationStatus,
    applicationStatus: rider.applicationStatus,
    verified: Boolean(rider.verified),
    isBanned: Boolean(rider.isBanned),
    dateOfBirth: rider.dateOfBirth,
    joinedDate: rider.createdAt,
    createdAt: rider.createdAt,
    updatedAt: rider.updatedAt,
    role: rider.role,
  }
}

export type MappedRider = ReturnType<typeof mapApiRider>

/** Booking locations are GeoJSON-ordered `[longitude, latitude]`. */
export const toLatLng = (raw: unknown): { lat: number; lng: number } | null => {
  const parts = Array.isArray(raw)
    ? raw.map(Number)
    : typeof raw === 'string'
      ? raw.split(',').map((s) => Number(s.trim()))
      : null
  if (!parts || parts.length !== 2 || !parts.every(Number.isFinite)) return null
  const [lng, lat] = parts
  return { lat, lng }
}

export const formatLatLng = (raw: unknown): string => {
  const point = toLatLng(raw)
  return point ? `${point.lat}, ${point.lng}` : ''
}

export const googleMapsUrl = (raw: unknown): string | null => {
  const point = toLatLng(raw)
  return point ? `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}` : null
}

export const googleMapsDirectionsUrl = (origin: unknown, destination: unknown, stops: unknown[] = []): string | null => {
  const from = toLatLng(origin)
  const to = toLatLng(destination)
  if (!from || !to) return null
  const waypoints = stops
    .map(toLatLng)
    .filter((p): p is { lat: number; lng: number } => p !== null)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|')
  const params = new URLSearchParams({
    api: '1',
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: 'driving',
  })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
