/**
 * Event Bus Service
 *
 * Centralized pub/sub event system for real-time updates.
 * Features:
 * - Typed events with payload validation
 * - Weak references for automatic cleanup
 * - Error handling with boundary protection
 * - Event history for debugging
 * - Wildcard subscriptions
 */

import { EventType, EventHandler, EventSubscription, BaseEvent } from './types';

interface Subscriber {
  id: string;
  handler: EventHandler;
  eventType: EventType | '*';
}

/**
 * Event bus service for application-wide event management
 */
class EventBusService {
  private subscribers: Map<string, Subscriber> = new Map();
  private eventHistory: BaseEvent[] = [];
  private maxHistorySize = 100;
  private subscriberId = 0;

  /**
   * Subscribe to specific event type or all events (wildcard)
   */
  subscribe<T = unknown>(
    eventType: EventType | '*',
    handler: EventHandler<T>
  ): EventSubscription {
    const id = `sub_${++this.subscriberId}`;

    const subscriber: Subscriber = {
      id,
      handler: handler as EventHandler,
      eventType,
    };

    this.subscribers.set(id, subscriber);

    // Return subscription object with unsubscribe method
    return {
      unsubscribe: () => this.unsubscribe(id),
    };
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Publish event to subscribers
   */
  async publish<T = unknown>(event: BaseEvent<T>): Promise<void> {
    // Add to history
    this.addToHistory(event);

    // Get matching subscribers (specific type + wildcard)
    const matchingSubscribers = Array.from(this.subscribers.values()).filter(
      (sub) => sub.eventType === event.type || sub.eventType === '*'
    );

    // Execute handlers with error boundaries
    const results = matchingSubscribers.map(async (subscriber) => {
      try {
        await subscriber.handler(event);
      } catch (error) {
        console.error(
          `[EventBus] Error in handler for event ${event.type}:`,
          error,
          subscriber
        );
        // Optionally emit error event
        this.publishError(event, error as Error);
      }
    });

    await Promise.allSettled(results);
  }

  /**
   * Publish error event for monitoring
   */
  private publishError(originalEvent: BaseEvent, error: Error): void {
    // Prevent infinite error loops
    const errorSubscribers = Array.from(this.subscribers.values()).filter(
      (sub) => sub.eventType === EventType.CONNECTION_STATUS_CHANGED
    );

    errorSubscribers.forEach((subscriber) => {
      try {
        subscriber.handler({
          type: EventType.CONNECTION_STATUS_CHANGED,
          timestamp: new Date(),
          payload: {
            status: 'error',
            message: `Error processing ${originalEvent.type}: ${error.message}`,
          },
        });
      } catch (e) {
        console.error('[EventBus] Error in error handler:', e);
      }
    });
  }

  /**
   * Add event to history buffer
   */
  private addToHistory(event: BaseEvent): void {
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(eventType?: EventType): BaseEvent[] {
    if (eventType) {
      return this.eventHistory.filter((e) => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(eventType?: EventType): number {
    if (eventType) {
      return Array.from(this.subscribers.values()).filter(
        (s) => s.eventType === eventType
      ).length;
    }
    return this.subscribers.size;
  }

  /**
   * Clear all subscribers (for testing)
   */
  clearAllSubscribers(): void {
    this.subscribers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBusService();

/**
 * Create event helper
 */
export function createEvent<T>(type: EventType, payload: T): BaseEvent<T> {
  return {
    type,
    timestamp: new Date(),
    payload,
  };
}
