/**
 * Notification Management Hooks
 * 
 * Provides reactive state management for notifications with
 * priority queuing, preferences, and real-time updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Notification,
  NotificationPreferences,
  NotificationStatus,
  NotificationQueueItem,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types';
import { processNotificationQueue, shouldShowNotification } from '../services/queue';

const STORAGE_KEY_NOTIFICATIONS = 'app_notifications';
const STORAGE_KEY_PREFERENCES = 'app_notification_preferences';

/**
 * Main hook for notification management.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFERENCES);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_PREFERENCES;
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  });

  // Persist notifications
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(preferences));
  }, [preferences]);

  const addNotification = useCallback(
    (notification: Notification) => {
      if (shouldShowNotification(notification, preferences)) {
        setNotifications((prev) => [notification, ...prev]);
      }
    },
    [preferences],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.READ } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: NotificationStatus.READ })));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.ARCHIVED } : n)),
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === NotificationStatus.UNREAD).length,
    [notifications],
  );

  const activeNotifications = useMemo(
    () => notifications.filter((n) => n.status !== NotificationStatus.ARCHIVED),
    [notifications],
  );

  return {
    notifications: activeNotifications,
    unreadCount,
    preferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
    setPreferences,
  };
};

/**
 * Hook for managing notification preferences.
 */
export const useNotificationPreferences = () => {
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFERENCES);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_PREFERENCES;
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  });

  const setPreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPreferences };
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleCategory = useCallback((category: keyof NotificationPreferences['categories']) => {
    setPreferencesState((prev) => {
      const updated = {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: !prev.categories[category],
        },
      };
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleQuietHours = useCallback(() => {
    setPreferencesState((prev) => {
      const updated = { ...prev, quietHoursEnabled: !prev.quietHoursEnabled };
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    preferences,
    setPreferences,
    toggleCategory,
    toggleQuietHours,
  };
};

/**
 * Hook for priority queue management.
 */
export const usePriorityQueue = (notifications: Notification[]) => {
  const [preferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFERENCES);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_PREFERENCES;
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  });

  const queue: NotificationQueueItem[] = useMemo(
    () =>
      notifications.map((notification) => ({
        notification,
        enqueuedAt: new Date(notification.timestamp).getTime(),
      })),
    [notifications],
  );

  const sortedNotifications = useMemo(
    () => processNotificationQueue(queue, preferences),
    [queue, preferences],
  );

  return sortedNotifications;
};
