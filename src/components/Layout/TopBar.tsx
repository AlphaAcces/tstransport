import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TslLogo } from '../Shared/TslLogo';
import { LanguageToggle } from '../Shared/LanguageToggle';
import { PreferencesPanel } from '../Shared/PreferencesPanel';
import { NotificationBadge } from '../../domains/notifications/components/NotificationBadge';
import { NotificationDrawer } from '../../domains/notifications/components/NotificationDrawer';
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

  const getButtonClass = (subject: Subject) => {
    const baseClass = "flex flex-col items-center px-4 py-1 rounded-md transition-colors duration-200";
    if (activeSubject === subject) {
      return `${baseClass} bg-accent-green/10 border border-accent-green/50`;
    }
    return `${baseClass} bg-component-dark hover:bg-gray-700/50`;
  };

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

        <div className="flex items-center space-x-2">
            <button onClick={() => onSubjectChange('tsl')} className={getButtonClass('tsl')}>
                <span className={`text-sm font-bold ${activeSubject === 'tsl' ? 'text-accent-green' : 'text-gray-200'}`}>{t('app.companyLabel')}</span>
                <span className="text-xs text-gray-500">{t('nav.business')}</span>
            </button>
            <button onClick={() => onSubjectChange('umit')} className={getButtonClass('umit')}>
                 <span className={`text-sm font-bold ${activeSubject === 'umit' ? 'text-accent-green' : 'text-gray-200'}`}>{t('app.userLabel')}</span>
                <span className="text-xs text-gray-500">{t('nav.personal')}</span>
            </button>
            <div className="ml-2">
              <LanguageToggle />
            </div>
            <div className="ml-2">
              <NotificationBadge count={unreadCount} onClick={() => setIsDrawerOpen(true)} />
            </div>
            <div className="ml-4">
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
