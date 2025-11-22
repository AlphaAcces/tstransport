/**
 * NotificationItem Component
 * 
 * Individual notification card with priority indicator and actions.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification, NotificationPriority, NotificationStatus } from '../types';
import { formatDate } from '../../../lib/format';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (url: string) => void;
}

const priorityConfig = {
  [NotificationPriority.HIGH]: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-800/50',
  },
  [NotificationPriority.MEDIUM]: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-800/50',
  },
  [NotificationPriority.LOW]: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-800/50',
  },
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const config = priorityConfig[notification.priority];
  const Icon = config.icon;

  const isUnread = notification.status === NotificationStatus.UNREAD;

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg border ${config.border} ${config.bg} ${
        isUnread ? 'ring-2 ring-accent-green/30' : ''
      } transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold ${
                isUnread ? 'text-gray-100' : 'text-gray-300'
              }`}
            >
              {notification.title}
            </h4>
            <button
              onClick={() => onDelete(notification.id)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={t('notifications.delete')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">
              {formatDate(notification.timestamp)}
            </span>
            {notification.actionUrl && (
              <button
                onClick={handleClick}
                className="text-xs text-accent-green hover:text-accent-green/80 flex items-center gap-1 transition-colors"
              >
                {t('notifications.viewDetails')}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
