export interface ICreateDriverInput {
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  contact: string
  email: string
  password: string
  driverExperience: string
  licenseNumber: string
  licenseClass: string
  expirationDate: string
  licenseImages: File[]
}

export const normalizeLicenseClass = (value: string): string => {
  const trimmed = String(value || '').trim()
  const fromLabel = trimmed.match(/class\s*([abc])/i)
  if (fromLabel) return fromLabel[1].toUpperCase()
  if (/^[ABC]$/i.test(trimmed)) return trimmed.toUpperCase()
  return trimmed.replace(/^class\s*/i, '').trim()
}

/** Backend accepts Bangladesh numbers as `+8801XXXXXXXXX`. */
export const normalizeContact = (value: string): string | null => {
  const raw = String(value || '').replace(/[^\d+]/g, '')
  const compact = raw.startsWith('+') ? `+${raw.slice(1).replace(/\D/g, '')}` : raw.replace(/\D/g, '')
  if (/^\+8801[3-9]\d{8}$/.test(compact)) return compact
  if (/^8801[3-9]\d{8}$/.test(compact)) return `+${compact}`
  if (/^01[3-9]\d{8}$/.test(compact)) return `+88${compact}`
  return null
}

export const toIsoDate = (ymd: string): string => {
  if (!ymd) return ''
  const d = new Date(`${ymd}T12:00:00`)
  return Number.isNaN(d.getTime()) ? ymd : d.toISOString()
}

export const buildDriverFormData = (input: ICreateDriverInput): FormData => {
  const formData = new FormData()
  formData.append('firstName', input.firstName.trim())
  formData.append('lastName', input.lastName.trim())
  if (input.middleName?.trim()) {
    formData.append('middleName', input.middleName.trim())
  }
  formData.append('dateOfBirth', toIsoDate(input.dateOfBirth))
  formData.append('contact', input.contact.trim())
  formData.append('email', input.email.trim())
  formData.append('role', 'DRIVER')
  formData.append('password', input.password.trim())
  formData.append('driverExperience', input.driverExperience)
  formData.append('licenseNumber', input.licenseNumber.trim())
  formData.append('licenseClass', normalizeLicenseClass(input.licenseClass))
  formData.append('expirationDate', toIsoDate(input.expirationDate))
  input.licenseImages.slice(0, 3).forEach((file) => {
    formData.append('licenseImage', file)
  })
  return formData
}
