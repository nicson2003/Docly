import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import doctorsReducer from './slices/doctorsSlice';
import bookingsReducer from './slices/bookingsSlice';

const rootReducer = combineReducers({
  doctors: doctorsReducer,
  bookings: bookingsReducer,
});

const persistConfig = {
  key: 'Docly_root',
  version: 1,
  storage: AsyncStorage,
  // Only persist bookings — doctors are always re-fetched from the API
  whitelist: ['bookings'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;
