import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { TslLogo } from '../Shared/TslLogo';
import { CaseSelector } from '../Shared/CaseSelector';
import { PreferencesPanel } from '../Shared/PreferencesPanel';
import { NotificationBadge } from '../../domains/notifications/components/NotificationBadge';
import { NotificationDrawer } from '../../domains/notifications/components/NotificationDrawer';
import { LocaleSwitcher } from '../../domains/settings/components/LocaleSwitcher';
import { CurrencySwitcher } from '../../domains/settings/components/CurrencySwitcher';
import { CountrySelector } from '../../domains/settings/components/CountrySelector';
import { useNotifications } from '../../domains/notifications/hooks';
import { Subject, View } from '../../types';

interface TopBarProps {
  onToggleNav: () => void;
  activeSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  currentViewId?: View;
  currentBreadcrumbs?: string[];
  navigateTo?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleNav, activeSubject, onSubjectChange, currentViewId, currentBreadcrumbs, navigateTo }) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const headerTitle = activeSubject === 'tsl' ? t('app.companyName') : t('app.userName');
  const consoleName = t('app.consoleName');
  const consoleShort = t('app.consoleShort');
  const subjectShort = activeSubject === 'tsl'
    ? t('common.subjects.tsl.short')
    : t('common.subjects.umit.short');

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-border-dark bg-component-dark/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-3 lg:gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onToggleNav}
                className="lg:hidden rounded-full border border-border-dark/70 p-2 text-gray-400 hover:text-white"
                aria-label={t('topbar.openNavigation', { defaultValue: 'Open navigation' })}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
              <TslLogo variant="header" className="h-9 w-auto" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{consoleShort}</p>
                <p className="text-lg font-semibold text-gray-100 sm:text-xl truncate" title={headerTitle}>{headerTitle}</p>
                <p className="text-xs text-gray-500 hidden sm:block truncate">{consoleName}</p>
                <p className="text-xs text-gray-500 sm:hidden truncate">{subjectShort}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                className="rounded-full border border-border-dark/60 p-2 text-gray-300 hover:text-white"
                onClick={() => setIsDrawerOpen(true)}
                aria-label={t('notifications.open', { defaultValue: 'Open notifications' })}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs font-semibold text-accent-green">{unreadCount}</span>
                )}
              </button>
              <PreferencesPanel
                currentViewId={currentViewId ?? 'dashboard'}
                currentBreadcrumbs={currentBreadcrumbs}
                navigateTo={navigateTo}
                variant="compact"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:items-start xl:[&>section]:border-l xl:[&>section]:border-border-dark/60 xl:[&>section]:pl-6 xl:[&>section:first-child]:border-l-0 xl:[&>section:first-child]:pl-0">
            <section className="flex min-w-0 flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-500/80">{t('topbar.caseSection', { defaultValue: 'Case context' })}</p>
              <CaseSelector activeSubject={activeSubject} onSubjectChange={onSubjectChange} />
            </section>

            <section className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-gray-500/90">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em]">{t('topbar.settingsSection', { defaultValue: 'View settings' })}</p>
                <span className="text-[10px] uppercase tracking-widest text-gray-600">{t('topbar.readOnly', { defaultValue: 'View only' })}</span>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <div className="flex-1 min-w-[120px] sm:flex-none">
                  <LocaleSwitcher variant="condensed" />
                </div>
                <div className="flex-1 min-w-[120px] sm:flex-none">
                  <CountrySelector variant="condensed" />
                </div>
                <div className="flex-1 min-w-[120px] sm:flex-none">
                  <CurrencySwitcher variant="condensed" />
                </div>
              </div>
            </section>

            <section className="flex min-w-0 flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-500/80">{t('topbar.workspaceTools', { defaultValue: 'Workspace tools' })}</p>
              <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
                <div className="hidden md:block">
                  <NotificationBadge count={unreadCount} onClick={() => setIsDrawerOpen(true)} />
                </div>
                <div className="hidden md:block max-w-[260px]">
                  <PreferencesPanel
                    currentViewId={currentViewId ?? 'dashboard'}
                    currentBreadcrumbs={currentBreadcrumbs}
                    navigateTo={navigateTo}
                  />
                </div>
              </div>
            </section>
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
