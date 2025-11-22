/**
 * Notification Queue Service
 * 
 * Manages priority-based queuing, quiet hours enforcement,
 * and category filtering for notifications.
 */

import {
  Notification,
  NotificationPriority,
  NotificationPreferences,
  NotificationQueueItem,
} from '../types';

const PRIORITY_WEIGHTS: Record<NotificationPriority, number> = {
  [NotificationPriority.HIGH]: 3,
  [NotificationPriority.MEDIUM]: 2,
  [NotificationPriority.LOW]: 1,
};

/**
 * Checks if current time falls within quiet hours.
 */
export const isWithinQuietHours = (
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): boolean => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Handle overnight range (e.g., 22:00 to 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

/**
 * Determines if a notification should be shown based on user preferences.
 */
export const shouldShowNotification = (
  notification: Notification,
  preferences: NotificationPreferences,
): boolean => {
  if (!preferences.enabled) return false;

  // Check category preference
  if (!preferences.categories[notification.category]) return false;

  // Check quiet hours
  if (preferences.quietHoursEnabled) {
    if (isWithinQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
      // Allow high-priority notifications even during quiet hours
      return notification.priority === NotificationPriority.HIGH;
    }
  }

  return true;
};

/**
 * Sorts notifications by priority (high to low) and timestamp (newest first).
 */
export const sortNotificationsByPriority = (
  a: NotificationQueueItem,
  b: NotificationQueueItem,
): number => {
  const priorityDiff =
    PRIORITY_WEIGHTS[b.notification.priority] - PRIORITY_WEIGHTS[a.notification.priority];

  if (priorityDiff !== 0) return priorityDiff;

  // Same priority: sort by timestamp (newest first)
  return b.enqueuedAt - a.enqueuedAt;
};

/**
 * Filters and sorts notifications based on preferences.
 */
export const processNotificationQueue = (
  queue: NotificationQueueItem[],
  preferences: NotificationPreferences,
): Notification[] => {
  return queue
    .filter((item) => shouldShowNotification(item.notification, preferences))
    .sort(sortNotificationsByPriority)
    .map((item) => item.notification);
};
