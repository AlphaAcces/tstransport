import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { View } from '../types';
import { Currency, AppLocale, Country } from '../domains/settings/types';

type SavedView = {
  id: string;
  payload: { view: View; breadcrumbs?: string[]; label?: string };
};

interface UserPreferencesState {
  compactMode: boolean;
  savedViews: SavedView[];
  currency: Currency;
  locale: AppLocale;
  country: Country;
  timezone: string;
  dateFormat: 'short' | 'medium' | 'long';
}

const initialState: UserPreferencesState = {
  compactMode: false,
  savedViews: [],
  currency: Currency.DKK,
  locale: AppLocale.DA_DK,
  country: Country.DENMARK,
  timezone: 'Europe/Copenhagen',
  dateFormat: 'medium',
};

export const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setCompactMode(state, action: PayloadAction<boolean>) {
      state.compactMode = action.payload;
    },
    setCurrency(state, action: PayloadAction<Currency>) {
      state.currency = action.payload;
    },
    setLocale(state, action: PayloadAction<AppLocale>) {
      state.locale = action.payload;
    },
    setCountry(state, action: PayloadAction<Country>) {
      state.country = action.payload;
    },
    setTimezone(state, action: PayloadAction<string>) {
      state.timezone = action.payload;
    },
    setDateFormat(state, action: PayloadAction<'short' | 'medium' | 'long'>) {
      state.dateFormat = action.payload;
    },
    saveView(state, action: PayloadAction<SavedView>) {
      // Prevent duplicates by id
      state.savedViews = state.savedViews.filter(v => v.id !== action.payload.id).concat(action.payload);
    },
    removeView(state, action: PayloadAction<string>) {
      state.savedViews = state.savedViews.filter((v) => v.id !== action.payload);
    },
    clearSavedViews(state) {
      state.savedViews = [];
    },
  },
});

export const {
  setCompactMode,
  setCurrency,
  setLocale,
  setCountry,
  setTimezone,
  setDateFormat,
  saveView,
  removeView,
  clearSavedViews
} = userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
