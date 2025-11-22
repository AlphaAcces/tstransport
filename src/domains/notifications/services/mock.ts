/**
 * Mock Notification Generator
 * 
 * Provides demo notifications for development and testing.
 */

import {
  Notification,
  NotificationPriority,
  NotificationCategory,
  NotificationStatus,
} from '../types';

let notificationIdCounter = 1;

const mockNotifications: Omit<Notification, 'id' | 'timestamp' | 'status'>[] = [
  {
    title: 'Critical Cash Flow Alert',
    message: 'Cash balance has fallen below critical threshold (31 DKK). Immediate action required.',
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.FINANCIAL,
    actionUrl: '/cashflow',
  },
  {
    title: 'Tax Case Update',
    message: 'New documentation received from SKAT regarding the 2.4M DKK case. Review required.',
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.LEGAL,
    actionUrl: '/timeline',
  },
  {
    title: 'Risk Score Increased',
    message: 'Overall risk score has increased from 87 to 92 due to liquidity deterioration.',
    priority: NotificationPriority.MEDIUM,
    category: NotificationCategory.RISK,
    actionUrl: '/risk',
  },
  {
    title: 'DSO Improvement',
    message: 'Days Sales Outstanding has improved from 65 to 58 days. Positive trend.',
    priority: NotificationPriority.LOW,
    category: NotificationCategory.FINANCIAL,
    actionUrl: '/cashflow',
  },
  {
    title: 'New Counterparty Identified',
    message: 'Potential new supplier relationship detected through network analysis.',
    priority: NotificationPriority.MEDIUM,
    category: NotificationCategory.INTELLIGENCE,
    actionUrl: '/counterparties',
  },
  {
    title: 'Action Item Due Soon',
    message: 'Action ACT-005 (Negotiate repayment) is due in 3 days.',
    priority: NotificationPriority.MEDIUM,
    category: NotificationCategory.SYSTEM,
    actionUrl: '/actions',
  },
  {
    title: 'Scenario Analysis Complete',
    message: 'AI analysis for "Worst Case" scenario is now available.',
    priority: NotificationPriority.LOW,
    category: NotificationCategory.INTELLIGENCE,
    actionUrl: '/scenarios',
  },
  {
    title: 'Commercial Contract Renewal',
    message: 'Major client contract renewal deadline approaching (30 days).',
    priority: NotificationPriority.HIGH,
    category: NotificationCategory.COMMERCIAL,
    actionUrl: '/counterparties',
  },
];

/**
 * Generates a random notification from the mock pool.
 */
export const generateMockNotification = (): Notification => {
  const template = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
  
  return {
    ...template,
    id: `notif-${notificationIdCounter++}`,
    timestamp: new Date().toISOString(),
    status: NotificationStatus.UNREAD,
  };
};

/**
 * Generates multiple mock notifications.
 */
export const generateMockNotifications = (count: number): Notification[] => {
  return Array.from({ length: count }, generateMockNotification);
};

/**
 * Simulates a notification stream (for testing real-time updates).
 */
export const createMockNotificationStream = (
  onNotification: (notification: Notification) => void,
  intervalMs: number = 10000,
): (() => void) => {
  const interval = setInterval(() => {
    onNotification(generateMockNotification());
  }, intervalMs);

  return () => clearInterval(interval);
};
