/**
 * ToastCenter Component
 * 
 * Manages ephemeral toast notifications with auto-dismiss and stacking.
 */

import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { NotificationItem } from './NotificationItem';

interface ToastCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

export const ToastCenter: React.FC<ToastCenterProps> = ({
  notifications,
  onDismiss,
  autoDismissMs = 5000,
}) => {
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

  useEffect(() => {
    const latest = notifications.slice(0, 3).map((n) => n.id);
    setVisibleToasts(latest);

    const timers = latest.map((id) =>
      setTimeout(() => {
        onDismiss(id);
      }, autoDismissMs),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications, onDismiss, autoDismissMs]);

  const toastsToShow = notifications.filter((n) => visibleToasts.includes(n.id));

  if (toastsToShow.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {toastsToShow.map((notification) => (
        <div
          key={notification.id}
          className="animate-slide-in-right shadow-2xl"
        >
          <NotificationItem
            notification={notification}
            onMarkAsRead={() => {}}
            onDelete={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};
