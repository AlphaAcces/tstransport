/**
 * NotificationDrawer Component
 * 
 * Slide-out panel displaying all notifications with filtering and actions.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCheck, Trash2, Settings } from 'lucide-react';
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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-component-dark border-l border-border-dark z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dark">
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
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label={t('notifications.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-b border-border-dark">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-green/20 text-accent-green rounded-lg hover:bg-accent-green/30 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('notifications.clearAll')}
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="ml-auto p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800/50"
              aria-label={t('notifications.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-border-dark overflow-x-auto scrollbar-hidden">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
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

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-sm">{t('notifications.empty')}</p>
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
    </>
  );
};
