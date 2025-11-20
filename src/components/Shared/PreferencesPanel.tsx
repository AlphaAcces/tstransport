import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import type { View } from '../../types';
import { setCompactMode, saveView, removeView } from '../../store/userPreferencesSlice';

interface PreferencesPanelProps {
  currentViewId: string;
  currentBreadcrumbs?: string[];
  navigateTo?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ currentViewId, currentBreadcrumbs = ['Dashboard'], navigateTo }) => {
  const prefs = useSelector((s: RootState) => s.userPreferences);
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = React.useState(false);

  const handleSave = () => {
    const id = `${currentViewId}-${Date.now()}`;
    const label = `${currentViewId}`;
    dispatch(saveView({ id, payload: { view: currentViewId, breadcrumbs: currentBreadcrumbs, label } }));
  };

  const handleRestore = (itemId: string) => {
    const item = prefs.savedViews.find(s => s.id === itemId);
    if (!item) return;
    // call navigate if provided
    navigateTo?.(item.payload.view as View, { breadcrumbs: item.payload.breadcrumbs });
    setOpen(false);
  };

  const handleDelete = (itemId: string) => {
    dispatch(removeView(itemId));
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400">Compact</label>
        <input
          type="checkbox"
          checked={prefs.compactMode}
          onChange={(e) => dispatch(setCompactMode(e.target.checked))}
        />
        <button
          onClick={handleSave}
          className="ml-2 text-xs bg-accent-blue/20 px-2 py-1 rounded"
        >
          Gem visning
        </button>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="ml-2 text-xs px-2 py-1 rounded border border-border-dark text-gray-200"
        >
          Gemte visninger
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-card-background border border-border p-3 rounded shadow-lg z-40">
          <h4 className="text-sm font-semibold mb-2">Gemte visninger</h4>
          {prefs.savedViews.length === 0 && <div className="text-xs text-gray-500">Ingen gemte visninger.</div>}
          <ul className="space-y-2 max-h-52 overflow-auto">
            {prefs.savedViews.map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-medium text-gray-200">{item.payload.label ?? item.payload.view}</div>
                  <div className="text-gray-400 text-[11px]">{new Date(parseInt(item.id.split('-').pop() || '0', 10)).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRestore(item.id)} className="text-xs px-2 py-1 bg-accent-green/20 rounded">Åbn</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 bg-red-700/20 rounded">Slet</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
