import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BookmarkCheck } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { removeView, clearSavedViews } from '../../store/userPreferencesSlice';
import { useFormatters } from '../../domains/settings/hooks';
import { NAV_ITEMS } from '../../config/navigation';
import type { View } from '../../types';

const viewAudience = (viewId: View) => {
  const navItem = NAV_ITEMS.find(item => item.id === viewId);
  if (!navItem) return 'Workspace';
  if (navItem.showFor.length === 1) {
    return navItem.showFor[0] === 'tsl' ? 'Business' : 'Personal';
  }
  return 'Shared';
};

export const SavedViewsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const saved = useSelector((s: RootState) => s.userPreferences.savedViews);
  const { formatDateTime } = useFormatters();

  const sorted = React.useMemo(() =>
    [...saved].sort((a, b) => {
      const aTs = parseInt(a.id.split('-').pop() || '0', 10);
      const bTs = parseInt(b.id.split('-').pop() || '0', 10);
      return bTs - aTs;
    }),
  [saved]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Saved Views</p>
          <h2 className="text-3xl font-semibold text-gray-100">Workspace snapshots</h2>
          <p className="text-sm text-gray-500">Gem dine vigtigste udsnit og hop tilbage med ét klik.</p>
        </div>
        {saved.length > 0 && (
          <button
            onClick={() => dispatch(clearSavedViews())}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10"
          >
            Slet alle
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border-dark/70 bg-component-dark/40 p-10 text-center text-sm text-gray-500">
          Ingen gemte visninger endnu. Brug knappen i topbaren for at gemme dit nuværende udsnit.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {sorted.map(item => (
            <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border-dark bg-component-dark/80 p-5 shadow-lg shadow-black/20 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">{item.payload.label ?? item.payload.view}</h3>
                  <p className="text-sm text-gray-500">{(item.payload.breadcrumbs || ['Dashboard']).join(' › ')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="rounded-full bg-border-dark/40 px-3 py-0.5 font-semibold text-gray-200">{viewAudience(item.payload.view)}</span>
                    <span>{formatDateTime(new Date(parseInt(item.id.split('-').pop() || '0', 10)))}</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center gap-3 border-t border-border-dark/60 pt-3 md:w-auto md:border-0 md:pt-0 md:self-center">
                <button
                  onClick={() => dispatch(removeView(item.id))}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                >
                  Slet
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedViewsPage;
