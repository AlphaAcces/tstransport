/**
 * NotificationDrawer Component
 *
 * Slide-out panel displaying all notifications with filtering and actions.
 * - Scroll shadows for better content indication
 * - Horizontal scrollable category tabs
 * - Friendly empty state with illustration
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCheck, Trash2, Settings, BellOff } from 'lucide-react';
import { Notification, NotificationCategory } from '../types';
import { NotificationItem } from './NotificationItem';

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNavigate?: (url: string) => void;
  onOpenSettings?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNavigate,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const filteredNotifications =
    filterCategory === 'all'
      ? notifications
      : notifications.filter((n) => n.category === filterCategory);

  const categories: Array<NotificationCategory | 'all'> = [
    'all',
    NotificationCategory.FINANCIAL,
    NotificationCategory.RISK,
    NotificationCategory.LEGAL,
    NotificationCategory.INTELLIGENCE,
    NotificationCategory.COMMERCIAL,
    NotificationCategory.SYSTEM,
  ];

  // Update scroll shadows based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowTopShadow(scrollTop > 10);
        setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [filteredNotifications.length]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-component-dark border-l border-border-dark z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t('notifications.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dark flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-200">
              {t('notifications.title')}
            </h2>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-400">
                {t('notifications.unreadCount', { count: unreadCount })}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            aria-label={t('notifications.close')}
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-b border-border-dark flex-shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-green/20 text-accent-green rounded-lg hover:bg-accent-green/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {t('notifications.clearAll')}
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="ml-auto p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              aria-label={t('notifications.settings')}
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Category Filter - Horizontally Scrollable */}
        <div className="p-4 border-b border-border-dark flex-shrink-0 overflow-x-auto scrollbar-hidden">
          <div
            className="flex gap-2 min-w-max"
            role="tablist"
            aria-label={t('notifications.filterByCategory', 'Filtrer efter kategori')}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                role="tab"
                aria-selected={filterCategory === cat}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green/50 ${
                  filterCategory === cat
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {t(`notifications.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List with Scroll Shadows */}
        <div className="flex-1 relative overflow-hidden">
          {/* Top scroll shadow */}
          <div
            className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-component-dark to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
              showTopShadow ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Bottom scroll shadow */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-component-dark to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
              showBottomShadow ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          <div
            ref={listRef}
            className="h-full overflow-y-auto scrollbar-hidden p-4 space-y-3"
            role="tabpanel"
          >
            {filteredNotifications.length === 0 ? (
              <div className="empty-state h-64" role="status" aria-live="polite">
                <BellOff className="empty-state-icon" aria-hidden="true" />
                <h3 className="empty-state-title">
                  {filterCategory === 'all'
                    ? t('notifications.emptyTitle', 'Ingen notifikationer')
                    : t('notifications.emptyFilterTitle', 'Ingen notifikationer i denne kategori')}
                </h3>
                <p className="empty-state-description">
                  {filterCategory === 'all'
                    ? t('notifications.emptyDescription', 'Du har ingen notifikationer endnu. Vigtige opdateringer vil blive vist her.')
                    : t('notifications.emptyFilterDescription', 'Prøv at vælge en anden kategori eller se alle notifikationer.')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
