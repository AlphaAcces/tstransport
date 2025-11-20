import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SavedView = {
  id: string;
  payload: any;
};

interface UserPreferencesState {
  compactMode: boolean;
  savedViews: SavedView[];
}

const initialState: UserPreferencesState = {
  compactMode: false,
  savedViews: [],
};

export const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setCompactMode(state, action: PayloadAction<boolean>) {
      state.compactMode = action.payload;
    },
    saveView(state, action: PayloadAction<SavedView>) {
      state.savedViews.push(action.payload);
    },
    removeView(state, action: PayloadAction<string>) {
      state.savedViews = state.savedViews.filter((v) => v.id !== action.payload);
    },
    clearSavedViews(state) {
      state.savedViews = [];
    },
  },
});

export const { setCompactMode, saveView, removeView, clearSavedViews } = userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
