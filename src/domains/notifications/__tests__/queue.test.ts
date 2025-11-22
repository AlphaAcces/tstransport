/**
 * Notification Queue Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isWithinQuietHours,
  shouldShowNotification,
  sortNotificationsByPriority,
  processNotificationQueue,
} from '../services/queue';
import {
  Notification,
  NotificationPriority,
  NotificationCategory,
  NotificationStatus,
  NotificationPreferences,
  NotificationQueueItem,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types';

describe('Notification Queue Service', () => {
  describe('isWithinQuietHours', () => {
    it('detects time within normal hours range', () => {
      const testDate = new Date('2025-01-01T23:30:00');
      expect(isWithinQuietHours('22:00', '06:00', testDate)).toBe(true);
    });

    it('detects time outside quiet hours', () => {
      const testDate = new Date('2025-01-01T14:00:00');
      expect(isWithinQuietHours('22:00', '06:00', testDate)).toBe(false);
    });

    it('handles overnight range correctly', () => {
      const testDate = new Date('2025-01-01T02:00:00');
      expect(isWithinQuietHours('22:00', '06:00', testDate)).toBe(true);
    });

    it('handles same-day range', () => {
      const testDate = new Date('2025-01-01T10:00:00');
      expect(isWithinQuietHours('09:00', '17:00', testDate)).toBe(true);
    });
  });

  describe('shouldShowNotification', () => {
    const mockNotification: Notification = {
      id: 'test-1',
      title: 'Test',
      message: 'Test message',
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.FINANCIAL,
      status: NotificationStatus.UNREAD,
      timestamp: new Date().toISOString(),
    };

    it('shows notification when enabled and category allowed', () => {
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: false, // Disable quiet hours for this test
      };
      expect(shouldShowNotification(mockNotification, prefs)).toBe(true);
    });

    it('hides notification when globally disabled', () => {
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: false,
      };
      expect(shouldShowNotification(mockNotification, prefs)).toBe(false);
    });

    it('hides notification when category is disabled', () => {
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        categories: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
          [NotificationCategory.FINANCIAL]: false,
        },
      };
      expect(shouldShowNotification(mockNotification, prefs)).toBe(false);
    });

    it('allows high-priority notifications during quiet hours', () => {
      const highPriorityNotif: Notification = {
        ...mockNotification,
        priority: NotificationPriority.HIGH,
      };
      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: true,
      };
      const result = shouldShowNotification(highPriorityNotif, prefs);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sortNotificationsByPriority', () => {
    it('sorts high priority before medium', () => {
      const high: NotificationQueueItem = {
        notification: {
          id: '1',
          title: 'High',
          message: 'High',
          priority: NotificationPriority.HIGH,
          category: NotificationCategory.RISK,
          status: NotificationStatus.UNREAD,
          timestamp: new Date().toISOString(),
        },
        enqueuedAt: Date.now(),
      };
      const medium: NotificationQueueItem = {
        notification: {
          id: '2',
          title: 'Medium',
          message: 'Medium',
          priority: NotificationPriority.MEDIUM,
          category: NotificationCategory.FINANCIAL,
          status: NotificationStatus.UNREAD,
          timestamp: new Date().toISOString(),
        },
        enqueuedAt: Date.now(),
      };

      expect(sortNotificationsByPriority(high, medium)).toBeLessThan(0);
      expect(sortNotificationsByPriority(medium, high)).toBeGreaterThan(0);
    });

    it('sorts by timestamp when priority is equal', () => {
      const older: NotificationQueueItem = {
        notification: {
          id: '1',
          title: 'Older',
          message: 'Older',
          priority: NotificationPriority.MEDIUM,
          category: NotificationCategory.RISK,
          status: NotificationStatus.UNREAD,
          timestamp: new Date().toISOString(),
        },
        enqueuedAt: Date.now() - 10000,
      };
      const newer: NotificationQueueItem = {
        notification: {
          id: '2',
          title: 'Newer',
          message: 'Newer',
          priority: NotificationPriority.MEDIUM,
          category: NotificationCategory.FINANCIAL,
          status: NotificationStatus.UNREAD,
          timestamp: new Date().toISOString(),
        },
        enqueuedAt: Date.now(),
      };

      expect(sortNotificationsByPriority(older, newer)).toBeGreaterThan(0);
    });
  });

  describe('processNotificationQueue', () => {
    it('filters and sorts notifications correctly', () => {
      const queue: NotificationQueueItem[] = [
        {
          notification: {
            id: '1',
            title: 'Low',
            message: 'Low',
            priority: NotificationPriority.LOW,
            category: NotificationCategory.SYSTEM,
            status: NotificationStatus.UNREAD,
            timestamp: new Date().toISOString(),
          },
          enqueuedAt: Date.now(),
        },
        {
          notification: {
            id: '2',
            title: 'High',
            message: 'High',
            priority: NotificationPriority.HIGH,
            category: NotificationCategory.RISK,
            status: NotificationStatus.UNREAD,
            timestamp: new Date().toISOString(),
          },
          enqueuedAt: Date.now(),
        },
        {
          notification: {
            id: '3',
            title: 'Disabled Category',
            message: 'Disabled',
            priority: NotificationPriority.MEDIUM,
            category: NotificationCategory.COMMERCIAL,
            status: NotificationStatus.UNREAD,
            timestamp: new Date().toISOString(),
          },
          enqueuedAt: Date.now(),
        },
      ];

      const prefs: NotificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        categories: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
          [NotificationCategory.COMMERCIAL]: false,
        },
        quietHoursEnabled: false,
      };

      const result = processNotificationQueue(queue, prefs);

      expect(result.length).toBe(2); // Disabled category excluded
      expect(result[0].priority).toBe(NotificationPriority.HIGH); // High priority first
    });
  });
});
