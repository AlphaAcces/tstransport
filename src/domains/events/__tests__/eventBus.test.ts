/**
 * EventBus Tests
 *
 * Tests for the event bus service including:
 * - Subscription management
 * - Event publishing
 * - Wildcard subscriptions
 * - Error handling
 * - History tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus, createEvent, EventType } from '../';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clearAllSubscribers();
    eventBus.clearHistory();
  });

  describe('Subscription Management', () => {
    it('should subscribe to specific event type', () => {
      const handler = vi.fn();
      const subscription = eventBus.subscribe(EventType.PERSON_UPDATED, handler);

      expect(subscription).toHaveProperty('unsubscribe');
      expect(eventBus.getSubscriberCount(EventType.PERSON_UPDATED)).toBe(1);
    });

    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const subscription = eventBus.subscribe(EventType.PERSON_UPDATED, handler);

      subscription.unsubscribe();

      expect(eventBus.getSubscriberCount(EventType.PERSON_UPDATED)).toBe(0);
    });

    it('should support multiple subscribers to same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.subscribe(EventType.PERSON_UPDATED, handler1);
      eventBus.subscribe(EventType.PERSON_UPDATED, handler2);

      expect(eventBus.getSubscriberCount(EventType.PERSON_UPDATED)).toBe(2);
    });

    it('should support wildcard subscriptions', () => {
      const handler = vi.fn();
      eventBus.subscribe('*', handler);

      expect(eventBus.getSubscriberCount()).toBe(1);
    });
  });

  describe('Event Publishing', () => {
    it('should publish event to specific subscribers', async () => {
      const handler = vi.fn();
      eventBus.subscribe(EventType.PERSON_UPDATED, handler);

      const event = createEvent(EventType.PERSON_UPDATED, {
        personId: '123',
        changes: { name: 'John Doe' },
      });

      await eventBus.publish(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not call unrelated subscribers', async () => {
      const personHandler = vi.fn();
      const companyHandler = vi.fn();

      eventBus.subscribe(EventType.PERSON_UPDATED, personHandler);
      eventBus.subscribe(EventType.COMPANY_UPDATED, companyHandler);

      const event = createEvent(EventType.PERSON_UPDATED, {
        personId: '123',
        changes: {},
      });

      await eventBus.publish(event);

      expect(personHandler).toHaveBeenCalledTimes(1);
      expect(companyHandler).not.toHaveBeenCalled();
    });

    it('should call wildcard subscribers for all events', async () => {
      const wildcardHandler = vi.fn();
      const specificHandler = vi.fn();

      eventBus.subscribe('*', wildcardHandler);
      eventBus.subscribe(EventType.PERSON_UPDATED, specificHandler);

      const event1 = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });
      const event2 = createEvent(EventType.COMPANY_UPDATED, { companyId: '2', changes: {} });

      await eventBus.publish(event1);
      await eventBus.publish(event2);

      expect(wildcardHandler).toHaveBeenCalledTimes(2);
      expect(specificHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle async event handlers', async () => {
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      eventBus.subscribe(EventType.PERSON_UPDATED, handler);

      const event = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });
      await eventBus.publish(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should catch errors in event handlers', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const workingHandler = vi.fn();

      eventBus.subscribe(EventType.PERSON_UPDATED, errorHandler);
      eventBus.subscribe(EventType.PERSON_UPDATED, workingHandler);

      const event = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });

      // Should not throw
      await expect(eventBus.publish(event)).resolves.not.toThrow();

      // Working handler should still be called
      expect(workingHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit connection error event on handler failure', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const connectionHandler = vi.fn();

      eventBus.subscribe(EventType.PERSON_UPDATED, errorHandler);
      eventBus.subscribe(EventType.CONNECTION_STATUS_CHANGED, connectionHandler);

      const event = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });
      await eventBus.publish(event);

      expect(connectionHandler).toHaveBeenCalled();
      const errorEvent = connectionHandler.mock.calls[0][0];
      expect(errorEvent.payload.status).toBe('error');
    });
  });

  describe('Event History', () => {
    it('should track event history', async () => {
      const event1 = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });
      const event2 = createEvent(EventType.COMPANY_UPDATED, { companyId: '2', changes: {} });

      await eventBus.publish(event1);
      await eventBus.publish(event2);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe(EventType.PERSON_UPDATED);
      expect(history[1].type).toBe(EventType.COMPANY_UPDATED);
    });

    it('should filter history by event type', async () => {
      const event1 = createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} });
      const event2 = createEvent(EventType.COMPANY_UPDATED, { companyId: '2', changes: {} });

      await eventBus.publish(event1);
      await eventBus.publish(event2);

      const personHistory = eventBus.getHistory(EventType.PERSON_UPDATED);
      expect(personHistory).toHaveLength(1);
      expect(personHistory[0].type).toBe(EventType.PERSON_UPDATED);
    });

    it('should limit history size', async () => {
      // Publish more than max history size (100)
      for (let i = 0; i < 150; i++) {
        await eventBus.publish(
          createEvent(EventType.PERSON_UPDATED, { personId: `${i}`, changes: {} })
        );
      }

      const history = eventBus.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear history', async () => {
      await eventBus.publish(createEvent(EventType.PERSON_UPDATED, { personId: '1', changes: {} }));

      eventBus.clearHistory();

      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('createEvent Helper', () => {
    it('should create event with timestamp', () => {
      const event = createEvent(EventType.PERSON_UPDATED, {
        personId: '123',
        changes: { name: 'Test' },
      });

      expect(event).toHaveProperty('type', EventType.PERSON_UPDATED);
      expect(event).toHaveProperty('timestamp');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload).toEqual({
        personId: '123',
        changes: { name: 'Test' },
      });
    });
  });

  describe('Subscriber Count', () => {
    it('should return total subscriber count', () => {
      eventBus.subscribe(EventType.PERSON_UPDATED, vi.fn());
      eventBus.subscribe(EventType.COMPANY_UPDATED, vi.fn());
      eventBus.subscribe('*', vi.fn());

      expect(eventBus.getSubscriberCount()).toBe(3);
    });

    it('should return subscriber count for specific event', () => {
      eventBus.subscribe(EventType.PERSON_UPDATED, vi.fn());
      eventBus.subscribe(EventType.PERSON_UPDATED, vi.fn());
      eventBus.subscribe(EventType.COMPANY_UPDATED, vi.fn());

      expect(eventBus.getSubscriberCount(EventType.PERSON_UPDATED)).toBe(2);
      expect(eventBus.getSubscriberCount(EventType.COMPANY_UPDATED)).toBe(1);
    });
  });
});
