/**
 * CaseSelector Component
 *
 * Unified selector for switching between company and person cases.
 * Provides dropdown with all available companies and persons.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, User, ChevronDown, Check, Database, Search } from 'lucide-react';
import type { CaseMeta } from '../../types';
import type { CaseRegistrySource } from '../../hooks/useCaseRegistry';

interface CaseSelectorProps {
  cases: CaseMeta[];
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string, options?: { redirectToDashboard?: boolean }) => void;
  isLoading?: boolean;
  source?: CaseRegistrySource;
  onOpenCaseLibrary?: () => void;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases = [],
  selectedCaseId,
  onSelectCase,
  isLoading = false,
  source = 'mock',
  onOpenCaseLibrary,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedCase = useMemo(() => (
    cases.find(option => option.id === selectedCaseId) || cases[0] || null
  ), [cases, selectedCaseId]);

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

  const statusBadge = source === 'api'
    ? {
      label: t('caseSelector.liveData', { defaultValue: 'Live data' }),
      className: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/40',
    }
    : {
      label: t('caseSelector.offlineData', { defaultValue: 'Offline data' }),
      className: 'text-amber-300 bg-amber-400/10 border-amber-400/40',
    };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (caseId: string) => {
    if (caseId === selectedCase?.id) {
      setIsOpen(false);
      return;
    }

    onSelectCase(caseId);
    setIsOpen(false);
  };

  const renderCaseMeta = (caseMeta: CaseMeta) => {
    const isActive = caseMeta.id === selectedCase?.id;
    return (
      <button
        key={caseMeta.id}
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={() => handleSelect(caseMeta.id)}
        className={`w-full rounded-2xl border px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] ${
          isActive
            ? 'border-[var(--color-gold)]/70 bg-[var(--color-gold)]/10 text-[var(--color-text)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-gold)]/50 hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-[var(--color-text)] truncate">{caseMeta.name}</p>
            <div className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              <span>{caseMeta.type === 'personal' ? t('nav.personal', { defaultValue: 'Privat' }) : t('nav.business', { defaultValue: 'Erhverv' })}</span>
              {caseMeta.region && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{caseMeta.region}</span>
                </>
              )}
            </div>
          </div>
          {isActive && <Check className="w-4 h-4 text-[var(--color-gold)] shrink-0" />}
        </div>
        {caseMeta.summary && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2">{caseMeta.summary}</p>
        )}
      </button>
    );
  };

  return (
    <div className="relative w-full min-w-0" ref={dropdownRef} aria-live="polite">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={!selectedCase && isLoading}
        className="w-full rounded-full border border-[var(--color-border-gold)]/70 bg-[var(--color-surface)]/70 px-4 py-2 pr-10 shadow-md hover:border-[var(--color-gold)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] shrink-0">
            {selectedCase?.type === 'business' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-[var(--color-text)] truncate" title={selectedCase?.name}>
              {selectedCase?.name ?? (isLoading
                ? t('common.loading', { defaultValue: 'Indlæser...' })
                : t('caseSelector.noCaseSelected', { defaultValue: 'Ingen sager' })
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              {selectedCase ? (
                <>
                  <span>{selectedCase.type === 'personal' ? t('nav.personal', { defaultValue: 'Privat' }) : t('nav.business', { defaultValue: 'Erhverv' })}</span>
                  {selectedCase.region && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{selectedCase.region}</span>
                    </>
                  )}
                </>
              ) : (
                <span>{t('caseSelector.selectPlaceholder', { defaultValue: 'Vælg en case' })}</span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-black/10 px-4 py-3 text-xs">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${statusBadge.className}`}>
              <Database className="h-3.5 w-3.5" />
              {statusBadge.label}
            </span>
            <span className="text-[var(--color-text-muted)]">
              {t('caseSelector.caseCount', { defaultValue: '{{count}} sager', count: cases.length })}
            </span>
          </div>

          {groupedCases.length === 0 && (
            <div className="p-4 text-sm text-[var(--color-text-muted)] flex items-center gap-2">
              <Search className="h-4 w-4" />
              {isLoading ? t('common.loading', { defaultValue: 'Indlæser...' }) : t('caseSelector.noResults', { defaultValue: 'Ingen sager tilgængelige' })}
            </div>
          )}

          {groupedCases.map(section => (
            <div key={section.key} className="p-3 border-b border-[var(--color-border)] last:border-b-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-2">
                {section.label}
              </p>
              <div className="space-y-2">
                {section.items.map(renderCaseMeta)}
              </div>
            </div>
          ))}

          {onOpenCaseLibrary && (
            <div className="border-t border-[var(--color-border)] bg-black/5 p-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-gold)]/60 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-gold)]/80 hover:bg-[var(--color-gold)]/10"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCaseLibrary();
                }}
              >
                <Search className="h-4 w-4" />
                {t('caseSelector.openCaseLibrary', { defaultValue: 'Åbn caseliste' })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
