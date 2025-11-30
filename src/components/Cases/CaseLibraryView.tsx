import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, CheckCircle2, Loader2, ShieldAlert, User } from 'lucide-react';
import { useCaseRegistry } from '../../hooks/useCaseRegistry';
import type { CaseMeta } from '../../types';

interface CaseLibraryViewProps {
  activeCaseId?: string | null;
  onSelectCase: (caseId: string, options?: { redirectToDashboard?: boolean }) => void;
  onClose?: () => void;
}

const CaseTypeIcon: React.FC<{ type?: string }> = ({ type }) => (
  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
    {type === 'personal' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-white/10" />
      <div className="flex-1 space-y-1">
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="h-3 w-1/3 rounded bg-white/5" />
      </div>
    </div>
    <div className="h-3 w-full rounded bg-white/5" />
    <div className="h-3 w-5/6 rounded bg-white/5" />
  </div>
);

export const CaseLibraryView: React.FC<CaseLibraryViewProps> = ({ activeCaseId, onSelectCase, onClose }) => {
  const { cases, isLoading, error, source } = useCaseRegistry();
  const { t } = useTranslation();

  const formatUpdatedAt = (caseMeta: CaseMeta): string => {
    if (!caseMeta.updatedAt) {
      return t('caseLibrary.unknownUpdated', { defaultValue: 'Ukendt opdatering' });
    }

    try {
      return new Intl.DateTimeFormat('da-DK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(caseMeta.updatedAt));
    } catch (err) {
      console.warn('[CaseLibraryView] Failed to format updatedAt', err);
      return caseMeta.updatedAt;
    }
  };

  const groupedCases = useMemo(() => {
    const groups = new Map<string, CaseMeta[]>();
    cases.forEach((caseMeta) => {
      const key = caseMeta.type ?? 'other';
      const existing = groups.get(key) ?? [];
      existing.push(caseMeta);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: key === 'personal'
        ? t('nav.personal', { defaultValue: 'Privat' })
        : key === 'business'
          ? t('nav.business', { defaultValue: 'Erhverv' })
          : key,
      items,
    }));
  }, [cases, t]);

  const sourceBadge = source === 'api'
    ? { label: t('caseSelector.liveData', { defaultValue: 'Live data' }), className: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' }
    : { label: t('caseSelector.offlineData', { defaultValue: 'Offline data' }), className: 'text-amber-200 border-amber-400/40 bg-amber-500/10' };

  const handleSelect = (caseId: string) => {
    onSelectCase(caseId, { redirectToDashboard: true });
  };

  const renderCases = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (!groupedCases.length) {
      return (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-sm text-[var(--color-text-muted)]">
          {t('caseSelector.noResults', { defaultValue: 'Ingen sager tilgængelige' })}
        </div>
      );
    }

    return groupedCases.map((section) => (
      <section key={section.key} className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            {section.label}
          </p>
          <span className="text-xs text-[var(--color-text-muted)]">
            {t('caseLibrary.caseCount', { defaultValue: '{{count}} sager', count: section.items.length })}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {section.items.map((caseMeta) => {
            const isActive = caseMeta.id === activeCaseId;
            return (
              <button
                key={caseMeta.id}
                type="button"
                onClick={() => handleSelect(caseMeta.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] ${
                  isActive
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 shadow-lg shadow-[var(--color-gold)]/20'
                    : 'border-white/10 bg-white/5 hover:border-[var(--color-gold)]/60 hover:bg-[var(--color-gold)]/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CaseTypeIcon type={caseMeta.type} />
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text)]">{caseMeta.name}</p>
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-text-muted)]">
                        {caseMeta.region ?? t('caseLibrary.regionFallback', { defaultValue: 'Global' })}
                      </p>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 className="h-5 w-5 text-[var(--color-gold)]" aria-label={t('caseLibrary.activeLabel', { defaultValue: 'Aktiv case' })} />}
                </div>
                {caseMeta.summary && (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)] line-clamp-2">{caseMeta.summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>{t('common.lastUpdated', { defaultValue: 'Opdateret' })}: {formatUpdatedAt(caseMeta)}</span>
                  <span>{t('caseLibrary.idLabel', { defaultValue: 'ID' })}: {caseMeta.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--color-text-muted)]">TS24 · Case Control</p>
          <h1 className="text-3xl font-bold text-white">{t('caseLibrary.title', { defaultValue: 'Casebibliotek' })}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t('caseLibrary.subtitle', { defaultValue: 'Vælg en aktiv sag for dashboards, AI-log og overvågning.' })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${sourceBadge.className}`}>
            {sourceBadge.label}
          </span>
          {onClose && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.navigation.backToDashboard', { defaultValue: 'Tilbage til dashboard' })}
            </button>
          )}
        </div>
      </div>

      {source !== 'api' && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">{t('caseLibrary.offlineTitle', { defaultValue: 'Viser lokale case-data' })}</p>
            <p className="text-amber-100/80">{t('caseLibrary.offlineBody', { defaultValue: 'API\'et for cases er utilgængeligt, så bibliotektet viser den seneste indbyggede kopi.' })}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">{t('caseLibrary.apiErrorTitle', { defaultValue: 'Kunne ikke hente cases fra API' })}</p>
            <p className="text-red-100/80">{t('caseLibrary.apiErrorBody', { defaultValue: 'Vender tilbage til lokale data indtil API’et svarer igen.' })}</p>
          </div>
        </div>
      )}

      {renderCases()}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading', { defaultValue: 'Indlæser…' })}
        </div>
      )}
    </div>
  );
};

export default CaseLibraryView;
