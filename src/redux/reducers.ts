import authReducer from './slice/authSlice'
import tripsReducer from './slice/tripsSlice'

export const reducers = {
  auth: authReducer,
  trips: tripsReducer,
}
