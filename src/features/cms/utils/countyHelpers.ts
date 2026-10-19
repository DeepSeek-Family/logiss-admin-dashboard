import type { CountyPriceMethod, ICounty, IPayer, ISaveCountyInput } from '@/redux/api/coverageApi'
import { countyPayerId, toApiPriceMethod } from '@/redux/api/coverageApi'
import { parseGeoJsonDocument, parsePolygons } from '@/utils/geofenceEngine'

export type UiPricingMethod = CountyPriceMethod

export interface IMileageTier {
  starting_mileage: number
  first_miles_price: number
  per_mile_price: number
}

export interface PayerCoverageDraft {
  name: string
  active: boolean
  pricingMethod: UiPricingMethod
  flatRate: number
  startingFare: number
  firstMilesPrice: number
  perMileRate: number
  mileageTiers: IMileageTier[]
  passengerCopayInside: number
  passengerCopayOutside: number
  geofencePolygons: [number, number][][]
  geofenceFileName: string
  geofenceFile?: File
  countyId?: string
  includedMiles?: number
  includedRate?: number
}

export const PRICING_METHOD_LABELS: Record<UiPricingMethod, string> = {
  flat_rate: 'Flat rate',
  per_mile: 'Per mile',
  mileage_based: 'Mileage based',
}

export const defaultMileageTiers = (): IMileageTier[] => [
  { starting_mileage: 0, first_miles_price: 0, per_mile_price: 0 },
]

export const emptyCoverageDraft = (payer?: Pick<IPayer, 'name' | 'isActive'> | null): PayerCoverageDraft => ({
  name: payer?.name || '',
  active: payer?.isActive !== false,
  pricingMethod: 'mileage_based',
  flatRate: 0,
  startingFare: 0,
  firstMilesPrice: 0,
  perMileRate: 0,
  mileageTiers: defaultMileageTiers(),
  passengerCopayInside: 0,
  passengerCopayOutside: 0,
  geofencePolygons: [],
  geofenceFileName: '',
  includedMiles: 0,
  includedRate: 0,
})

export const findCountyForPayer = (counties: ICounty[], payerId: string): ICounty | undefined => {
  const matches = counties.filter((c) => countyPayerId(c) === payerId)
  if (matches.length <= 1) return matches[0]
  return [...matches].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0]
}

export const geoJsonToRings = (geo?: ICounty['coversAreasGeoJSON'] | null): [number, number][][] => {
  if (!geo) return []
  const parsed = parseGeoJsonDocument(geo)
  return parsed.ok ? parsed.rings : parsePolygons((geo as { coordinates?: unknown }).coordinates)
}

export const toUiPriceMethod = (method?: string): UiPricingMethod => toApiPriceMethod(method)

export const methodChipLabel = (method?: string): string => {
  const ui = toUiPriceMethod(method)
  if (ui === 'mileage_based') return 'By miles'
  if (ui === 'per_mile') return 'Per mile'
  return 'Flat'
}

const num = (value: unknown, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const normalizeMileageTiers = (raw: unknown): IMileageTier[] => {
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = []
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((item) => ({
      starting_mileage: num(item?.starting_mileage),
      first_miles_price: num(item?.first_miles_price),
      per_mile_price: num(item?.per_mile_price),
    }))
  }
  if (parsed && typeof parsed === 'object') {
    const single = parsed as Record<string, unknown>
    return [
      {
        starting_mileage: num(single.starting_mileage),
        first_miles_price: num(single.first_miles_price),
        per_mile_price: num(single.per_mile_price),
      },
    ]
  }
  return defaultMileageTiers()
}

export const mapCountyToDraft = (payer: IPayer, county?: ICounty): PayerCoverageDraft => {
  const draft = emptyCoverageDraft(payer)
  if (!county) return draft

  const pricingMethod = toUiPriceMethod(county.priceMethod)
  const rings = geoJsonToRings(county.coversAreasGeoJSON)
  const tiers = normalizeMileageTiers(county.mileage_based_price)
  const firstTier = tiers[0] || { starting_mileage: 0, first_miles_price: 0, per_mile_price: 0 }
  const firstMilesPrice = num(county.first_miles_price ?? firstTier.first_miles_price)
  const perMileRate = num(county.per_mile_price ?? firstTier.per_mile_price)

  return {
    ...draft,
    countyId: county._id,
    active: county.isActive !== undefined ? county.isActive : draft.active,
    pricingMethod,
    flatRate: num(county.flat_rate_price),
    startingFare: num(county.starting_fare),
    firstMilesPrice,
    perMileRate,
    mileageTiers: tiers,
    passengerCopayInside: num(county.insidePrice),
    passengerCopayOutside: num(county.outsidePrice),
    geofencePolygons: rings,
    geofenceFileName: rings.length ? 'Saved fence' : '',
    includedMiles: num(firstTier.starting_mileage),
    includedRate: firstMilesPrice,
  }
}

export const mapDraftToCountyInput = (payerId: string, draft: PayerCoverageDraft): ISaveCountyInput => {
  const priceMethod = toApiPriceMethod(draft.pricingMethod)
  const base: ISaveCountyInput = {
    payersId: payerId,
    priceMethod,
    insidePrice: num(draft.passengerCopayInside),
    outsidePrice: num(draft.passengerCopayOutside),
    isActive: draft.active,
    file: draft.geofenceFile,
  }

  if (priceMethod === 'flat_rate') {
    return { ...base, flat_rate_price: num(draft.flatRate) }
  }

  if (priceMethod === 'per_mile') {
    return {
      ...base,
      starting_fare: num(draft.startingFare),
      first_miles_price: num(draft.firstMilesPrice ?? draft.includedRate),
      per_mile_price: num(draft.perMileRate),
    }
  }

  const tiers: IMileageTier[] = draft.mileageTiers?.length
    ? draft.mileageTiers.map((t) => ({
        starting_mileage: num(t.starting_mileage),
        first_miles_price: num(t.first_miles_price),
        per_mile_price: num(t.per_mile_price),
      }))
    : defaultMileageTiers()

  return {
    ...base,
    mileage_based_price: tiers,
    starting_mileage: num(tiers[0]?.starting_mileage),
    first_miles_price: num(tiers[0]?.first_miles_price),
    per_mile_price: num(tiers[0]?.per_mile_price),
  }
}
