/**
 * Mock SSE Service
 *
 * Simulates Server-Sent Events for development/testing.
 * Generates realistic event streams with configurable frequency.
 */

import { EventType, BaseEvent, createEvent } from '../';

export interface MockSSEOptions {
  /** Interval between events in milliseconds */
  eventInterval?: number;
  /** Whether to enable mock events */
  enabled?: boolean;
  /** Event types to generate */
  eventTypes?: EventType[];
}

/**
 * Mock SSE service for development
 */
export class MockSSEService {
  private intervalId: NodeJS.Timeout | null = null;
  private options: Required<MockSSEOptions>;
  private eventCounter = 0;

  constructor(options: MockSSEOptions = {}) {
    this.options = {
      eventInterval: options.eventInterval ?? 10000, // Default: 10 seconds
      enabled: options.enabled ?? true,
      eventTypes: options.eventTypes ?? [
        EventType.PERSON_UPDATED,
        EventType.COMPANY_UPDATED,
        EventType.TIMELINE_ADDED,
        EventType.RISK_CHANGED,
      ],
    };
  }

  /**
   * Start generating mock events
   */
  start(callback: (event: BaseEvent) => void): void {
    if (!this.options.enabled) {
      console.log('[MockSSE] Mock events disabled');
      return;
    }

    console.log('[MockSSE] Starting mock event stream...');

    this.intervalId = setInterval(() => {
      const event = this.generateRandomEvent();
      console.log('[MockSSE] Generated event:', event.type);
      callback(event);
    }, this.options.eventInterval);
  }

  /**
   * Stop generating mock events
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MockSSE] Stopped mock event stream');
    }
  }

  /**
   * Generate random event
   */
  private generateRandomEvent(): BaseEvent {
    const eventType =
      this.options.eventTypes[
        Math.floor(Math.random() * this.options.eventTypes.length)
      ];

    this.eventCounter++;

    switch (eventType) {
      case EventType.PERSON_UPDATED:
        return createEvent(EventType.PERSON_UPDATED, {
          personId: 'person-1',
          changes: {
            keyFindings: [`Mock update #${this.eventCounter}: New finding discovered`],
          },
        });

      case EventType.COMPANY_UPDATED:
        return createEvent(EventType.COMPANY_UPDATED, {
          companyId: 'company-1',
          changes: {
            revenue: Math.floor(Math.random() * 100000000) + 50000000,
          },
        });

      case EventType.TIMELINE_ADDED:
        return createEvent(EventType.TIMELINE_ADDED, {
          event: {
            id: `event-${Date.now()}`,
            date: new Date().toISOString(),
            title: `Mock Event #${this.eventCounter}`,
            description: 'Simulated timeline event from mock SSE',
            category: 'Business',
            impact: 'Medium',
          },
        });

      case EventType.RISK_CHANGED:
        const levels = ['Low', 'Medium', 'High', 'Critical'];
        return createEvent(EventType.RISK_CHANGED, {
          category: 'Financial',
          oldLevel: levels[Math.floor(Math.random() * levels.length)],
          newLevel: levels[Math.floor(Math.random() * levels.length)],
          reason: `Mock risk assessment update #${this.eventCounter}`,
        });

      default:
        return createEvent(eventType, {
          message: `Mock event ${this.eventCounter}`,
        });
    }
  }

  /**
   * Configure options
   */
  configure(options: Partial<MockSSEOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
