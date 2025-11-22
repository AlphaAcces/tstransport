/**
 * Notification System Types
 * 
 * Provides type-safe notification management with priority queuing,
 * category filtering, and user preferences.
 */

export enum NotificationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationCategory {
  FINANCIAL = 'financial',
  RISK = 'risk',
  LEGAL = 'legal',
  INTELLIGENCE = 'intelligence',
  SYSTEM = 'system',
  COMMERCIAL = 'commercial',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  status: NotificationStatus;
  timestamp: string; // ISO 8601
  actionUrl?: string; // Optional deep link to relevant view
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format (e.g., "22:00")
  quietHoursEnd: string; // HH:mm format (e.g., "06:00")
  showToasts: boolean;
  playSounds: boolean;
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface NotificationQueueItem {
  notification: Notification;
  enqueuedAt: number; // Unix timestamp
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  categories: {
    [NotificationCategory.FINANCIAL]: true,
    [NotificationCategory.RISK]: true,
    [NotificationCategory.LEGAL]: true,
    [NotificationCategory.INTELLIGENCE]: true,
    [NotificationCategory.SYSTEM]: true,
    [NotificationCategory.COMMERCIAL]: true,
  },
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  showToasts: true,
  playSounds: false,
};
