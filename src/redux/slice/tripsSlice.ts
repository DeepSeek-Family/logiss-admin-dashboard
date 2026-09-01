import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { trips as mockTrips } from '@/data/mockData'

export interface Trip {
  id: string
  status: string
  driverId?: string
  [key: string]: any
}

interface TripsState {
  items: Trip[]
  filters: { status?: string }
  selectedTripId: string | null
  loading: boolean
  error: string | null
}

const initialState: TripsState = {
  items: mockTrips as Trip[],
  filters: {},
  selectedTripId: null,
  loading: false,
  error: null,
}

export const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      state.items = action.payload
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.items.unshift(action.payload)
    },
    updateTrip: (state, action: PayloadAction<{ id: string; patch: Partial<Trip> }>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.patch }
      }
    },
    assignDriver: (state, action: PayloadAction<{ tripId: string; driverId: string }>) => {
      const index = state.items.findIndex(t => t.id === action.payload.tripId)
      if (index !== -1) {
        state.items[index].driverId = action.payload.driverId
        state.items[index].status = 'assigned'
      }
    },
    setTripFilters: (state, action: PayloadAction<{ status?: string }>) => {
      state.filters = action.payload
    },
    setSelectedTripId: (state, action: PayloadAction<string | null>) => {
      state.selectedTripId = action.payload
    },
  },
})

export const { setTrips, addTrip, updateTrip, assignDriver, setTripFilters, setSelectedTripId } = tripsSlice.actions
export default tripsSlice.reducer
