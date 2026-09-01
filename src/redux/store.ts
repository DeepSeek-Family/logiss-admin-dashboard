import { configureStore, type Middleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apis } from '@/redux/apis'
import { reducers } from '@/redux/reducers'

const apiReducers = Object.fromEntries(
  apis.map((api) => [api.reducerPath, api.reducer]),
)

const apiMiddleware = apis.map((api) => api.middleware) as Middleware[]

export const store = configureStore({
  reducer: {
    ...reducers,
    ...apiReducers,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
