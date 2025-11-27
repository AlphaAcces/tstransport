/**
 * Event Queue
 *
 * Priority-based queue system for events.
 * Events are processed in order of severity/priority.
 *
 * Features:
 * - Priority levels (critical, high, normal, low)
 * - FIFO within same priority
 * - Configurable max queue size
 * - Queue statistics and monitoring
 */

import type { BaseEvent, EventType } from '../types';

/**
 * Priority levels for events (lower number = higher priority)
 */
export enum EventPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

/**
 * Queued event with priority metadata
 */
export interface QueuedEvent<T = unknown> {
  event: BaseEvent<T>;
  priority: EventPriority;
  enqueuedAt: Date;
  id: string;
  retryCount: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  totalEnqueued: number;
  totalProcessed: number;
  totalDropped: number;
  currentSize: number;
  byPriority: Record<EventPriority, number>;
}

/**
 * Queue configuration
 */
export interface EventQueueConfig {
  maxSize: number;
  maxRetries: number;
  priorityMapping?: Partial<Record<EventType, EventPriority>>;
}

const defaultConfig: EventQueueConfig = {
  maxSize: 1000,
  maxRetries: 3,
  priorityMapping: {},
};

/**
 * Default priority mapping for known event types
 */
const defaultPriorityMapping: Partial<Record<string, EventPriority>> = {
  'risk:alert:created': EventPriority.CRITICAL,
  'risk:changed': EventPriority.HIGH,
  'system:connection:changed': EventPriority.HIGH,
  'action:created': EventPriority.NORMAL,
  'timeline:added': EventPriority.NORMAL,
  'person:updated': EventPriority.LOW,
  'company:updated': EventPriority.LOW,
};

/**
 * Priority-based event queue
 */
export class EventQueue {
  private queues: Map<EventPriority, QueuedEvent[]> = new Map();
  private config: EventQueueConfig;
  private eventIdCounter = 0;
  private stats: QueueStats = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalDropped: 0,
    currentSize: 0,
    byPriority: {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.LOW]: 0,
    },
  };

  constructor(config: Partial<EventQueueConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Initialize priority queues
    for (const priority of Object.values(EventPriority)) {
      if (typeof priority === 'number') {
        this.queues.set(priority, []);
      }
    }
  }

  /**
   * Enqueue an event with automatic priority detection
   */
  enqueue<T>(event: BaseEvent<T>, priority?: EventPriority): QueuedEvent<T> | null {
    // Check queue size limit
    if (this.stats.currentSize >= this.config.maxSize) {
      // Try to drop lowest priority event
      if (!this.dropLowestPriority()) {
        this.stats.totalDropped++;
        console.warn('[EventQueue] Queue full, dropping event:', event.type);
        return null;
      }
    }

    // Determine priority
    const eventPriority = priority ?? this.getPriorityForEvent(event);

    // Create queued event
    const queuedEvent: QueuedEvent<T> = {
      event,
      priority: eventPriority,
      enqueuedAt: new Date(),
      id: `evt_${++this.eventIdCounter}_${Date.now()}`,
      retryCount: 0,
    };

    // Add to appropriate queue
    const queue = this.queues.get(eventPriority);
    if (queue) {
      queue.push(queuedEvent);
      this.stats.totalEnqueued++;
      this.stats.currentSize++;
      this.stats.byPriority[eventPriority]++;
    }

    return queuedEvent;
  }

  /**
   * Dequeue the highest priority event
   */
  dequeue(): QueuedEvent | null {
    // Check queues in priority order
    for (const priority of [
      EventPriority.CRITICAL,
      EventPriority.HIGH,
      EventPriority.NORMAL,
      EventPriority.LOW,
    ]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        const queuedEvent = queue.shift();
        if (queuedEvent) {
          this.stats.currentSize--;
          this.stats.byPriority[priority]--;
          this.stats.totalProcessed++;
          return queuedEvent;
        }
      }
    }

    return null;
  }

  /**
   * Peek at the next event without removing it
   */
  peek(): QueuedEvent | null {
    for (const priority of [
      EventPriority.CRITICAL,
      EventPriority.HIGH,
      EventPriority.NORMAL,
      EventPriority.LOW,
    ]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue[0];
      }
    }
    return null;
  }

  /**
   * Requeue a failed event for retry
   */
  requeue(queuedEvent: QueuedEvent): boolean {
    if (queuedEvent.retryCount >= this.config.maxRetries) {
      console.warn('[EventQueue] Max retries exceeded for event:', queuedEvent.id);
      this.stats.totalDropped++;
      return false;
    }

    queuedEvent.retryCount++;
    queuedEvent.enqueuedAt = new Date();

    const queue = this.queues.get(queuedEvent.priority);
    if (queue) {
      // Add to front of same priority queue for immediate retry
      queue.unshift(queuedEvent);
      this.stats.currentSize++;
      this.stats.byPriority[queuedEvent.priority]++;
      return true;
    }

    return false;
  }

  /**
   * Get priority for an event type
   */
  private getPriorityForEvent(event: BaseEvent): EventPriority {
    // Check custom mapping first
    const customPriority = this.config.priorityMapping?.[event.type as EventType];
    if (customPriority !== undefined) {
      return customPriority;
    }

    // Check default mapping
    const defaultPriority = defaultPriorityMapping[event.type];
    if (defaultPriority !== undefined) {
      return defaultPriority;
    }

    // Default to NORMAL
    return EventPriority.NORMAL;
  }

  /**
   * Drop lowest priority event when queue is full
   */
  private dropLowestPriority(): boolean {
    // Start from lowest priority
    for (const priority of [
      EventPriority.LOW,
      EventPriority.NORMAL,
      EventPriority.HIGH,
    ]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        queue.pop(); // Remove oldest from this priority
        this.stats.currentSize--;
        this.stats.byPriority[priority]--;
        this.stats.totalDropped++;
        return true;
      }
    }
    // Never drop CRITICAL events
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.stats.currentSize === 0;
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.stats.currentSize;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.stats.currentSize = 0;
    this.stats.byPriority = {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.LOW]: 0,
    };
  }

  /**
   * Get all events of a specific priority
   */
  getEventsByPriority(priority: EventPriority): QueuedEvent[] {
    return [...(this.queues.get(priority) ?? [])];
  }
}

// Default singleton instance
export const eventQueue = new EventQueue();
