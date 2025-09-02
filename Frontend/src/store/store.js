import { configureStore } from '@reduxjs/toolkit'
import jobSlice from './jobSlice'

export const store = configureStore({
  reducer: {
    jobs: jobSlice,
  },
})
