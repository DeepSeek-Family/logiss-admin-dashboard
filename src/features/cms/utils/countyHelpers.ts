import type { CountyPriceMethod, ICounty, IPayer, ISaveCountyInput } from '@/redux/api/coverageApi'
import { countyPayerId, toApiPriceMethod } from '@/redux/api/coverageApi'
import { parseGeoJsonDocument, parsePolygons } from '@/utils/geofenceEngine'

export type UiPricingMethod = CountyPriceMethod

export interface PayerCoverageDraft {
  name: string
  active: boolean
  pricingMethod: UiPricingMethod
  flatRate: number
  startingFare: number
  includedMiles: number
  includedRate: number
  perMileRate: number
  passengerCopayInside: number
  passengerCopayOutside: number
  geofencePolygons: [number, number][][]
  geofenceFileName: string
  geofenceFile?: File
  countyId?: string
}

export const PRICING_METHOD_LABELS: Record<UiPricingMethod, string> = {
  flat_rate: 'Flat rate',
  per_mile: 'Per mile',
  mileage_based: 'By miles',
}

export const emptyCoverageDraft = (payer?: Pick<IPayer, 'name' | 'isActive'> | null): PayerCoverageDraft => ({
  name: payer?.name || '',
  active: payer?.isActive !== false,
  pricingMethod: 'mileage_based',
  flatRate: 0,
  startingFare: 0,
  includedMiles: 0,
  includedRate: 0,
  perMileRate: 0,
  passengerCopayInside: 0,
  passengerCopayOutside: 0,
  geofencePolygons: [],
  geofenceFileName: '',
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

export const mapCountyToDraft = (payer: IPayer, county?: ICounty): PayerCoverageDraft => {
  const draft = emptyCoverageDraft(payer)
  if (!county) return draft

  const miles = county.mileage_based_price || {}
  const pricingMethod = toUiPriceMethod(county.priceMethod)
  const rings = geoJsonToRings(county.coversAreasGeoJSON)

  return {
    ...draft,
    countyId: county._id,
    pricingMethod,
    flatRate: num(county.flat_rate_price),
    startingFare: num(county.starting_fare),
    includedMiles: num(miles.starting_mileage),
    includedRate: num(miles.first_miles_price ?? county.first_miles_price),
    perMileRate: num(miles.per_mile_price ?? county.per_mile_price),
    passengerCopayInside: num(county.insidePrice),
    passengerCopayOutside: num(county.outsidePrice),
    geofencePolygons: rings,
    geofenceFileName: rings.length ? 'Saved fence' : '',
  }
}

export const mapDraftToCountyInput = (payerId: string, draft: PayerCoverageDraft): ISaveCountyInput => {
  const priceMethod = toApiPriceMethod(draft.pricingMethod)
  const base: ISaveCountyInput = {
    payersId: payerId,
    priceMethod,
    insidePrice: num(draft.passengerCopayInside),
    outsidePrice: num(draft.passengerCopayOutside),
    file: draft.geofenceFile,
  }

  if (priceMethod === 'flat_rate') {
    return { ...base, flat_rate_price: num(draft.flatRate) }
  }

  if (priceMethod === 'per_mile') {
    return {
      ...base,
      starting_fare: num(draft.startingFare),
      first_miles_price: num(draft.includedRate),
      per_mile_price: num(draft.perMileRate),
    }
  }

  return {
    ...base,
    starting_mileage: num(draft.includedMiles),
    first_miles_price: num(draft.includedRate),
    per_mile_price: num(draft.perMileRate),
  }
}
