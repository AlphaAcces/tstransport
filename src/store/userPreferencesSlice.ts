import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserPreferencesState {
  compactMode: boolean;
  savedViews: Record<string, any>;
}

const initialState: UserPreferencesState = {
  compactMode: false,
  savedViews: {},
};

export const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setCompactMode(state, action: PayloadAction<boolean>) {
      state.compactMode = action.payload;
    },
    saveView(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.savedViews[action.payload.id] = action.payload.payload;
    },
    removeView(state, action: PayloadAction<string>) {
      delete state.savedViews[action.payload];
    },
  },
});

export const { setCompactMode, saveView, removeView } = userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
