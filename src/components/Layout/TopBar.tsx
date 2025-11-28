/**
 * TopBar Component
 *
 * Fixed header with:
 * - Dynamic height measurement via ResizeObserver (reports to parent for layout spacing)
 * - Desktop: Single compact row with logo, case selector, language/market controls, saved views, notifications, user
 * - Mobile: Stacked layout with all controls visible (logo/case/user → language/market cards → actions)
 * - Responsive breakpoints: <768px (mobile), 768-1023px (tablet), ≥1024px (desktop)
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, UserCircle2 } from 'lucide-react';
import { TslLogo } from '../Shared/TslLogo';
import { CaseSelector } from '../Shared/CaseSelector';
import { NotificationBadge } from '../../domains/notifications/components/NotificationBadge';
import { NotificationDrawer } from '../../domains/notifications/components/NotificationDrawer';
import { LocaleSwitcher } from '../../domains/settings/components/LocaleSwitcher';
import { CountrySelector } from '../../domains/settings/components/CountrySelector';
import { useNotifications } from '../../domains/notifications/hooks';
import { PreferencesPanel } from '../Shared/PreferencesPanel';
import { ThemeToggle } from '../Shared/ThemeToggle';
import { Subject, View } from '../../types';
import { TenantSwitcher } from '../../domains/tenant/TenantSwitcher';

interface TopBarProps {
  onToggleNav: () => void;
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  currentView: View;
  currentBreadcrumbs?: string[];
  onNavigate?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
  onHeightChange?: (height: number) => void;
  user?: { id: string; role: 'admin' | 'user' } | null;
  onTenantChange?: (tenantId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleNav,
  activeSubject,
  onSubjectChange,
  currentView,
  currentBreadcrumbs,
  onNavigate,
  onHeightChange,
  user,
  onTenantChange,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Measure header height dynamically and report to parent for layout spacing
  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => {
      onHeightChange(node.getBoundingClientRect().height);
    };

    updateHeight();

    // Use ResizeObserver for efficient tracking of header size changes
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(node);
      return () => observer.disconnect();
    }

    // Fallback to window resize listener
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [onHeightChange]);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const roleLabel = user?.role === 'admin'
    ? t('auth.roles.admin', { defaultValue: 'Admin' })
    : user?.role === 'user'
      ? t('auth.roles.user', { defaultValue: 'Bruger' })
      : null;

  const userInitials = (user?.id ?? '?').slice(0, 2).toUpperCase();

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-30 border-b border-border-dark bg-component-dark/95 backdrop-blur-xl shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2.5 px-3 py-2 lg:py-2.5 lg:px-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2.5 lg:gap-4">
          <div className="flex items-center gap-2.5 lg:gap-3 w-full lg:w-auto min-w-0">
            <button
              onClick={onToggleNav}
              className="lg:hidden rounded-lg border border-border-dark/70 p-1.5 text-gray-400 hover:text-white shrink-0"
              aria-label={t('topbar.openNavigation', { defaultValue: 'Open navigation' })}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <TslLogo variant="header" className="h-7 w-auto shrink-0" />
            <div className="flex-1 lg:flex-initial min-w-0 max-w-[200px] sm:max-w-none">
              <CaseSelector activeSubject={activeSubject} onSubjectChange={onSubjectChange} />
            </div>
            <div className="flex lg:hidden items-center gap-2 ml-auto">
              <button
                type="button"
                className="rounded-lg border border-border-dark/60 p-1.5 text-gray-300 hover:text-white relative"
                onClick={() => setIsDrawerOpen(true)}
                aria-label={t('notifications.open', { defaultValue: 'Open notifications' })}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-green text-[9px] font-bold text-gray-900">{unreadCount}</span>
                )}
              </button>
              <div className="rounded-xl border border-border-dark/70 bg-base-dark/40 px-2.5 py-1.5">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-green/15 text-accent-green text-xs font-semibold">{userInitials}</div>
                    <div className="text-[11px] font-semibold text-gray-100">{user?.id ?? t('auth.guest', { defaultValue: 'Gæst' })}</div>
                  </div>
                ) : (
                  <UserCircle2 className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 flex-1 justify-between">
            <div className="flex items-center gap-1.5">
              <TenantSwitcher variant="compact" onTenantChange={onTenantChange} />
              <div className="rounded-xl border border-border-dark/70 bg-component-dark/50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">SPROG</span>
                  <LocaleSwitcher variant="condensed" />
                </div>
              </div>
              <div className="rounded-xl border border-border-dark/70 bg-component-dark/50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">MARKED</span>
                  <CountrySelector variant="condensed" />
                </div>
              </div>
              <PreferencesPanel
                currentViewId={currentView}
                currentBreadcrumbs={currentBreadcrumbs}
                navigateTo={onNavigate}
              />
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle variant="button" />
              <div className="rounded-xl border border-border-dark/70 bg-component-dark/60 px-1.5 py-0.5 text-gray-300">
                <NotificationBadge count={unreadCount} onClick={() => setIsDrawerOpen(true)} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border-dark/70 bg-base-dark/40 px-2.5 py-1.5">
                {user ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/15 text-accent-green font-semibold text-sm">{userInitials}</div>
                ) : (
                  <UserCircle2 className="h-6 w-6 text-gray-500" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-100 leading-tight truncate">{user?.id ?? t('auth.guest', { defaultValue: 'Gæst' })}</p>
                  {roleLabel && <p className="text-[10px] uppercase tracking-widest text-gray-500/80">{roleLabel}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5 lg:hidden">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              {[{
                key: 'language',
                label: t('settings.language.label', { defaultValue: 'Language' }),
                control: <LocaleSwitcher variant="condensed" />,
              }, {
                key: 'market',
                label: t('settings.market.label', { defaultValue: 'Market' }),
                control: <CountrySelector variant="condensed" />,
              }].map(field => (
                <div key={field.key} className="rounded-2xl border border-border-dark/70 bg-component-dark/40 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500/80">{field.label}</p>
                  <div className="mt-2">
                    {field.control}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <PreferencesPanel
                  currentViewId={currentView}
                  currentBreadcrumbs={currentBreadcrumbs}
                  navigateTo={onNavigate}
                  variant="compact"
                />
              </div>
              <button
                type="button"
                className="rounded-xl border border-border-dark/70 bg-component-dark/60 px-2 py-1.5 text-xs font-semibold text-gray-300 shrink-0"
                onClick={() => setIsDrawerOpen(true)}
              >
                {t('notifications.open', { defaultValue: 'Notifikationer' })}
                {unreadCount > 0 && <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-green text-[10px] font-bold text-gray-900">{unreadCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setIsDrawerOpen(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        onClearAll={clearAll}
      />
    </header>
  );
};
