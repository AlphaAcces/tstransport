import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    <header className="fixed top-0 left-0 right-0 z-20 bg-component-dark/80 backdrop-blur-sm border-b border-border-dark">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 min-w-0">
          <button onClick={onToggleNav} className="lg:hidden text-gray-400 hover:text-white mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
          <TslLogo variant="header" className="h-8 w-auto mr-4" />
          <div className="hidden sm:flex items-baseline truncate">
            <h1 className="text-xl font-bold text-gray-200 tracking-tight">{headerTitle}</h1>
            <span className="font-normal text-gray-400 ml-2 truncate">/ {consoleName}</span>
          </div>
           <h1 className="sm:hidden text-lg font-bold text-gray-200 truncate ml-2">{subjectShort} / {consoleShort}</h1>
        </div>

        <div className="flex items-center space-x-3">
            {/* Case Selection */}
            <CaseSelector activeSubject={activeSubject} onSubjectChange={onSubjectChange} />

            {/* Vertical Separator */}
            <div className="h-8 w-px bg-border-dark hidden md:block"></div>

            {/* Language & Notifications Group */}
            <div className="flex items-center space-x-2">
              <LocaleSwitcher />
              <NotificationBadge count={unreadCount} onClick={() => setIsDrawerOpen(true)} />
            </div>

            {/* Vertical Separator */}
            <div className="h-8 w-px bg-border-dark hidden lg:block"></div>

            {/* Market Settings Group */}
            <div className="hidden lg:flex items-center space-x-2">
              <CountrySelector />
              <CurrencySwitcher />
            </div>

            {/* Vertical Separator */}
            <div className="h-8 w-px bg-border-dark hidden xl:block"></div>

            {/* Saved Views */}
            <div className="hidden xl:block">
              <PreferencesPanel currentViewId={currentViewId ?? 'dashboard'} currentBreadcrumbs={currentBreadcrumbs} navigateTo={navigateTo} />
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
