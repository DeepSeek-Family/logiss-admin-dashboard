export const PAYER_TYPE_VALUES = [
  'government',
  'country_payer',
  'city',
  'insurance',
  'self_pay',
  'facility',
  'other',
] as const

export type PayerType = (typeof PAYER_TYPE_VALUES)[number]

export const PAYER_TYPE_OPTIONS: { label: string; value: PayerType }[] = [
  { label: 'Government', value: 'government' },
  { label: 'County payer', value: 'country_payer' },
  { label: 'City', value: 'city' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Self pay', value: 'self_pay' },
  { label: 'Facility', value: 'facility' },
  { label: 'Other', value: 'other' },
]

export const isPayerType = (value: string): value is PayerType =>
  (PAYER_TYPE_VALUES as readonly string[]).includes(value)

/** Map UI labels, legacy values, or common typos to a valid API enum. */
export const normalizePayerType = (input?: string): PayerType => {
  if (!input) return 'government'
  const trimmed = String(input).trim()
  const lower = trimmed.toLowerCase()

  if (isPayerType(lower)) return lower

  const typoFixes: Record<string, PayerType> = {
    governmet: 'government',
    goverment: 'government',
    govermnent: 'government',
    country: 'country_payer',
    county: 'country_payer',
    county_payer: 'country_payer',
    selfpay: 'self_pay',
    'self-pay': 'self_pay',
  }
  if (typoFixes[lower]) return typoFixes[lower]

  const byLabel = PAYER_TYPE_OPTIONS.find(
    o => o.label.toLowerCase() === lower || o.label.toLowerCase().replace(/\s+/g, '_') === lower,
  )
  if (byLabel) return byLabel.value

  return 'government'
}

export const payerTypeLabel = (type: string): string =>
  PAYER_TYPE_OPTIONS.find(o => o.value === type)?.label
  || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
