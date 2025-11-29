import React from 'react';
import { Bookmark, PlusCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState, AppDispatch } from '../../store';
import type { View } from '../../types';
import { setCompactMode, saveView, removeView, clearSavedViews } from '../../store/userPreferencesSlice';
import { useFormatters } from '../../domains/settings/hooks';
import { NAV_ITEMS } from '../../config/navigation';

interface PreferencesPanelProps {
  currentViewId: View;
  currentBreadcrumbs?: string[];
  navigateTo?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
  variant?: 'default' | 'compact';
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ currentViewId, currentBreadcrumbs = ['Dashboard'], navigateTo, variant = 'default' }) => {
  const { t } = useTranslation();
  const prefs = useSelector((s: RootState) => s.userPreferences);
  const dispatch = useDispatch<AppDispatch>();
  const { formatDateTime } = useFormatters();
  const [open, setOpen] = React.useState(false);

  const handleSave = () => {
    const id = `${currentViewId}-${Date.now()}`;
    const navLabel = NAV_ITEMS.find(item => item.id === currentViewId)?.label ?? currentViewId;
    dispatch(saveView({ id, payload: { view: currentViewId, breadcrumbs: currentBreadcrumbs, label: navLabel } }));
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

  const savedViewsSorted = React.useMemo(() =>
    [...prefs.savedViews].sort((a, b) => {
      const aTs = parseInt(a.id.split('-').pop() || '0', 10);
      const bTs = parseInt(b.id.split('-').pop() || '0', 10);
      return bTs - aTs;
    }),
  [prefs.savedViews]);

  const audienceLabel = (viewId: View) => {
    const navItem = NAV_ITEMS.find(item => item.id === viewId);
    if (!navItem) return 'Workspace';
    if (navItem.showFor.length === 1) {
      return navItem.showFor[0] === 'tsl' ? 'Business' : 'Personal';
    }
    return 'Shared';
  };

  const primaryButtonClasses = variant === 'compact'
    ? 'inline-flex items-center gap-1 rounded-lg border border-border-dark/70 px-2.5 py-1 text-xs font-medium text-gray-100 hover:border-accent-green/50'
    : 'inline-flex items-center gap-2 rounded-lg border border-border-dark/70 px-3 py-1.5 text-sm font-medium text-gray-100 hover:border-accent-green/50';

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className={`${primaryButtonClasses} bg-accent-green/10 border-accent-green/30 prefs-btn`}
          type="button"
          title={t('preferences.saveView', { defaultValue: 'Gem visning' })}
          aria-label={t('preferences.saveView', { defaultValue: 'Gem visning' })}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          <span className="prefs-btn__label">{t('preferences.saveView', { defaultValue: 'Gem visning' })}</span>
        </button>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`${primaryButtonClasses} bg-component-dark/60 prefs-btn`}
          type="button"
          title={t('preferences.savedViews', { defaultValue: 'Gemte visninger' })}
          aria-label={t('preferences.savedViews', { defaultValue: 'Gemte visninger' })}
        >
          <Bookmark className="h-4 w-4 shrink-0" />
          <span className="prefs-btn__label">{t('preferences.savedViews', { defaultValue: 'Gemte visninger' })}</span>
          <span className="prefs-btn__count">({prefs.savedViews.length})</span>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-2rem)] max-w-[320px] sm:w-[320px] rounded-2xl border border-border-dark bg-component-dark p-4 shadow-2xl shadow-black/40 z-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-100">Gemte visninger</h4>
              <p className="text-xs text-gray-500">Snapshots af nuværende udsnit</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400" htmlFor="compact-mode-toggle">
              <span>Compact</span>
              <input
                id="compact-mode-toggle"
                type="checkbox"
                checked={prefs.compactMode}
                onChange={(e) => dispatch(setCompactMode(e.target.checked))}
                aria-label="Toggle compact mode"
              />
            </label>
          </div>

          <div className="mt-3 max-h-64 space-y-3 overflow-auto pr-1">
            {savedViewsSorted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-dark/70 py-6 text-center text-xs text-gray-500">
                Ingen gemte visninger endnu.
              </div>
            ) : (
              savedViewsSorted.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border-dark/50 bg-component-dark/70 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-100 truncate" title={item.payload.label ?? item.payload.view}>
                        {item.payload.label ?? item.payload.view}
                      </p>
                      <span className="rounded-full bg-border-dark/40 px-2 py-0.5 text-[11px] font-semibold text-gray-300">
                        {audienceLabel(item.payload.view)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{(item.payload.breadcrumbs || ['Dashboard']).join(' › ')}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{formatDateTime(new Date(parseInt(item.id.split('-').pop() || '0', 10)))}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button onClick={() => handleRestore(item.id)} className="rounded-lg bg-accent-green/20 px-2 py-1 text-xs font-semibold text-accent-green hover:bg-accent-green/30">
                      Åbn
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20">
                      Slet
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {prefs.savedViews.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearSavedViews())}
              className="mt-3 w-full text-left text-xs font-medium text-red-300 hover:text-red-200"
            >
              Slet alle
            </button>
          )}
        </div>
      )}
    </div>
  );
};
