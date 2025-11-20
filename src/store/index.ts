import { configureStore } from '@reduxjs/toolkit';
import userPreferencesReducer from './userPreferencesSlice';
import { loadState, saveState } from '../lib/localStorage';

const PERSIST_KEY = 'tsl_user_prefs_v1';

const preloaded = loadState(PERSIST_KEY) ?? undefined;

export const store = configureStore({
  reducer: {
    userPreferences: userPreferencesReducer,
  },
  preloadedState: preloaded,
});

store.subscribe(() => {
  saveState(PERSIST_KEY, { userPreferences: store.getState().userPreferences });
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
