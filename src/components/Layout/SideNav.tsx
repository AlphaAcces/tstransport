/**
 * SideNav Component
 *
 * Fixed left navigation sidebar with:
 * - Dynamic top offset (synced with TopBar height via props)
 * - Sectioned menu items filtered by activeSubject (tsl/umit)
 * - Settings footer: currency switcher, user info, logout
 * - Mobile: slide-in overlay; Desktop: always visible (lg:translate-x-0)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { View, Subject } from '../../types';
import { NAV_ITEMS } from '../../config/navigation';
import { CurrencySwitcher } from '../../domains/settings/components/CurrencySwitcher';

interface SideNavProps {
  currentView: View;
  activeSubject: Subject;
  onNavigate: (view: View) => void;
  isOpen: boolean;
  navigateToFull?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
  user?: { id: string; role: 'admin' | 'user' } | null;
  onLogout?: () => void;
  topOffset: number;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentView,
  activeSubject,
  onNavigate,
  isOpen,
  navigateToFull,
  user,
  onLogout,
  topOffset,
}) => {
  const { t } = useTranslation();
  const visibleNavItems = NAV_ITEMS.filter(item => item.showFor.includes(activeSubject));

  const businessSections: Array<{ key: string; label?: string; items: View[] }> = [
    { key: 'core', items: ['dashboard', 'executive'] },
    { key: 'analysis', label: 'ANALYSIS', items: ['person', 'companies', 'financials', 'hypotheses', 'cashflow', 'sector'] },
    { key: 'operations', label: 'OPERATIONS', items: ['counterparties', 'scenarios'] },
    { key: 'riskActions', label: 'RISK & ACTIONS', items: ['timeline', 'risk', 'actions'] },
  ];

  const personalSections: Array<{ key: string; label?: string; items: View[] }> = [
    { key: 'core', items: ['dashboard', 'person'] },
    { key: 'timeline', label: 'TIMELINE', items: ['timeline'] },
    { key: 'riskActions', label: 'RISK & ACTIONS', items: ['risk', 'actions'] },
  ];

  const sections = activeSubject === 'tsl' ? businessSections : personalSections;

  const renderIcon = (icon: React.ReactElement) => {
    const className = `h-4 w-4 ${icon.props.className ?? ''}`.trim();
    return React.cloneElement(icon, { className, color: undefined, stroke: 'currentColor' });
  };

  const handleNavigate = (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => {
    if (navigateToFull) {
      navigateToFull(view, options);
    } else {
      onNavigate(view);
    }
  };

  const roleLabel = user?.role === 'admin'
    ? t('auth.roles.admin', { defaultValue: 'Admin' })
    : user?.role === 'user'
      ? t('auth.roles.user', { defaultValue: 'Bruger' })
      : t('auth.guest', { defaultValue: 'Gæst' });

  const initials = (user?.id ?? '?').slice(0, 2).toUpperCase();

  return (
    <aside
      aria-label={t('nav.primaryMenu', { defaultValue: 'Primary navigation' })}
      className={`fixed top-0 left-0 z-20 h-full w-64 sm:w-72 max-w-[90vw] border-r border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-sm shadow-2xl lg:shadow-none transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden`}
      style={{ paddingTop: topOffset }}
    >
      <div className="flex h-full flex-col">
        <nav className="flex-1 space-y-5 p-4 pb-6 overflow-y-auto scrollbar-hidden">
          {sections.map(section => {
            const sectionItems = visibleNavItems.filter(item => section.items.includes(item.id));
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.key}>
                {section.label && (
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                    {section.label}
                  </p>
                )}
                <ul className="space-y-1">
                  {sectionItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigate(item.id)}
                          className={`sidenav-item group ${isActive ? 'sidenav-item--active' : ''}`}
                        >
                          <span className={`sidenav-item__icon ${isActive ? 'sidenav-item__icon--active' : ''}`}>
                            {renderIcon(item.icon)}
                          </span>
                          <span className="truncate">{item.i18nKey ? t(item.i18nKey) : item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 p-4 space-y-4">
          <div>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] truncate">
              {t('nav.settingsSection', { defaultValue: 'INDSTILLINGER' })}
            </p>
            <div className="mt-2 space-y-3">
              <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-background)]/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]/80 truncate">
                  {t('settings.currency.label', { defaultValue: 'Display currency' })}
                </p>
                <div className="mt-1">
                  <CurrencySwitcher variant="condensed" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-background)]/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)] truncate">{user?.id ?? t('auth.guest', { defaultValue: 'Gæst' })}</p>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{roleLabel}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout', { defaultValue: 'Log ud' })}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
