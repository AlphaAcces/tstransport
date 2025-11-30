/**
 * TopBar Component - Intel24 Redesign
 *
 * Streamlined header with:
 * - TS24 branded logo (replacing TSL)
 * - Harmonized height (56px desktop, responsive mobile)
 * - Intuitive grouped controls: Left (logo, case), Center (tenant), Right (actions, user)
 * - Settings dropdown with language, market, theme
 * - Dark/light theme support
 */

import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  UserCircle2,
  Settings,
  Menu,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Ts24Logo } from '../Shared/Ts24Logo';
import { CaseSelector } from '../Shared/CaseSelector';
import { NotificationDrawer } from '../../domains/notifications/components/NotificationDrawer';
import { useNotifications } from '../../domains/notifications/hooks';
import { PreferencesPanel } from '../Shared/PreferencesPanel';
import { View } from '../../types';
import { TenantSwitcher } from '../../domains/tenant/TenantSwitcher';
import type { AuthUser } from '../../domains/auth/types';
import type { CaseMeta } from '../../types';
import type { CaseRegistrySource } from '../../hooks/useCaseRegistry';

interface TopBarProps {
  onToggleNav: () => void;
  caseOptions: CaseMeta[];
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string, options?: { redirectToDashboard?: boolean }) => void;
  isCaseListLoading?: boolean;
  caseSource?: CaseRegistrySource;
  onOpenCaseLibrary?: () => void;
  currentView: View;
  currentBreadcrumbs?: string[];
  onNavigate?: (view: View, options?: { fromDashboard?: boolean; breadcrumbs?: string[] }) => void;
  onHeightChange?: (height: number) => void;
  user?: AuthUser | null;
  onTenantChange?: (tenantId: string) => void;
  onOpenCommandDeck: () => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleNav,
  caseOptions = [],
  selectedCaseId,
  onSelectCase,
  isCaseListLoading,
  caseSource,
  onOpenCaseLibrary,
  currentView,
  currentBreadcrumbs,
  onNavigate,
  onHeightChange,
  user,
  onTenantChange,
  onOpenCommandDeck,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Measure header height dynamically
  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => {
      onHeightChange(node.getBoundingClientRect().height);
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [onHeightChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const userDisplayName = user?.name ?? user?.id ?? t('auth.guest', { defaultValue: 'Guest' });
  const initialsSource = user?.name ?? user?.id ?? '?';
  const userInitials = initialsSource.slice(0, 2).toUpperCase();
  const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);
  const handleLogoutClick = () => {
    onLogout?.();
    setIsUserMenuOpen(false);
  };

  return (
    <header
      ref={headerRef}
      className="topbar fixed top-0 left-0 right-0 z-30"
    >
      <div className="topbar__container">
        {/* Left Section: Menu toggle, Logo, Case Selector */}
        <div className="topbar__left">
          <button
            onClick={onToggleNav}
            className="topbar__menu-btn lg:hidden"
            aria-label={t('topbar.openNavigation', { defaultValue: 'Open navigation' })}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Ts24Logo variant="header" />

          <div className="topbar__divider hidden lg:block" />

          <div className="hidden sm:block">
            <CaseSelector
              cases={caseOptions}
              selectedCaseId={selectedCaseId}
              onSelectCase={onSelectCase}
              isLoading={isCaseListLoading}
              source={caseSource}
              onOpenCaseLibrary={onOpenCaseLibrary}
            />
          </div>
        </div>

        {/* Center Section: Tenant Switcher (Desktop only) */}
        <div className="topbar__center hidden lg:flex">
          <TenantSwitcher variant="compact" onTenantChange={onTenantChange} />
        </div>

        {/* Right Section: Actions */}
        <div className="topbar__right">
          {/* Save View Button */}
          <PreferencesPanel
            currentViewId={currentView}
            currentBreadcrumbs={currentBreadcrumbs}
            navigateTo={onNavigate}
            variant="compact"
          />

          {/* Settings Dropdown */}
          <button
            onClick={onOpenCommandDeck}
            className="topbar__icon-btn"
            aria-label={t('topbar.settings', { defaultValue: 'Settings' })}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="topbar__icon-btn"
            aria-label={t('notifications.open', { defaultValue: 'Notifications' })}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="topbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="topbar__user"
              onClick={toggleUserMenu}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="topbar__user-avatar">
                {user ? userInitials : <UserCircle2 className="h-5 w-5" />}
              </div>
              <div className="topbar__user-info hidden lg:block">
                <span className="topbar__user-name">{userDisplayName}</span>
                {roleLabel && <span className="topbar__user-role">{roleLabel}</span>}
              </div>
              <ChevronDown className="topbar__user-chevron" aria-hidden="true" />
            </button>
            {isUserMenuOpen && (
              <div className="topbar__user-menu" role="menu">
                <button
                  type="button"
                  className="topbar__user-menu-item"
                  onClick={handleLogoutClick}
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout', { defaultValue: 'Log out' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Controls Row */}
      <div className="topbar__mobile lg:hidden">
        <CaseSelector
          cases={caseOptions}
          selectedCaseId={selectedCaseId}
          onSelectCase={onSelectCase}
          isLoading={isCaseListLoading}
          source={caseSource}
          onOpenCaseLibrary={onOpenCaseLibrary}
        />
        <TenantSwitcher variant="compact" onTenantChange={onTenantChange} />
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
