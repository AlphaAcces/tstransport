import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setCompactMode, saveView } from '../../store/userPreferencesSlice';

interface PreferencesPanelProps {
  currentViewId: string;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ currentViewId }) => {
  const prefs = useSelector((s: RootState) => s.userPreferences);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-400">Compact</label>
      <input
        type="checkbox"
        checked={prefs.compactMode}
        onChange={(e) => dispatch(setCompactMode(e.target.checked))}
      />
      <button
        onClick={() => dispatch(saveView({ id: `${currentViewId}-${Date.now()}`, payload: { view: currentViewId } }))}
        className="ml-2 text-xs bg-accent-blue/20 px-2 py-1 rounded"
      >
        Gem visning
      </button>
    </div>
  );
};
