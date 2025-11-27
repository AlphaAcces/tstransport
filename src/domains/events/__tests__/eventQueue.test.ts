/**
 * Event Queue Tests
 *
 * Tests for the priority-based event queue system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventQueue, EventPriority } from '../core/eventQueue';
import { EventType, type BaseEvent } from '../types';

describe('EventQueue', () => {
  let queue: EventQueue;

  const createEvent = (type: EventType = EventType.RISK_CHANGED): BaseEvent => ({
    type,
    timestamp: new Date(),
    payload: { test: true },
  });

  beforeEach(() => {
    queue = new EventQueue();
  });

  describe('enqueue', () => {
    it('should add events to the queue', () => {
      const event = createEvent();
      queue.enqueue(event);

      expect(queue.size()).toBe(1);
    });

    it('should assign automatic priority based on event type', () => {
      const event = createEvent(); // RISK_CHANGED maps to HIGH priority
      queue.enqueue(event);

      const dequeued = queue.dequeue();
      expect(dequeued?.priority).toBe(EventPriority.HIGH);
    });

    it('should respect custom priority', () => {
      const event = createEvent();
      queue.enqueue(event, EventPriority.CRITICAL);

      const dequeued = queue.dequeue();
      expect(dequeued?.priority).toBe(EventPriority.CRITICAL);
    });

    it('should increment queue size for each enqueue', () => {
      queue.enqueue(createEvent());
      queue.enqueue(createEvent());
      queue.enqueue(createEvent());

      expect(queue.size()).toBe(3);
    });
  });

  describe('dequeue', () => {
    it('should return null for empty queue', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should return events in priority order', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.LOW);
      queue.enqueue(createEvent(EventType.RISK_CHANGED), EventPriority.CRITICAL);
      queue.enqueue(createEvent(EventType.COMPANY_UPDATED), EventPriority.NORMAL);

      const first = queue.dequeue();
      expect(first?.event.type).toBe(EventType.RISK_CHANGED);

      const second = queue.dequeue();
      expect(second?.event.type).toBe(EventType.COMPANY_UPDATED);

      const third = queue.dequeue();
      expect(third?.event.type).toBe(EventType.PERSON_UPDATED);
    });

    it('should return events in FIFO order for same priority', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.NORMAL);
      queue.enqueue(createEvent(EventType.COMPANY_UPDATED), EventPriority.NORMAL);
      queue.enqueue(createEvent(EventType.TIMELINE_ADDED), EventPriority.NORMAL);

      const first = queue.dequeue();
      expect(first?.event.type).toBe(EventType.PERSON_UPDATED);

      const second = queue.dequeue();
      expect(second?.event.type).toBe(EventType.COMPANY_UPDATED);

      const third = queue.dequeue();
      expect(third?.event.type).toBe(EventType.TIMELINE_ADDED);
    });

    it('should decrement queue size on dequeue', () => {
      queue.enqueue(createEvent());
      queue.enqueue(createEvent());

      expect(queue.size()).toBe(2);
      queue.dequeue();
      expect(queue.size()).toBe(1);
      queue.dequeue();
      expect(queue.size()).toBe(0);
    });
  });

  describe('peek', () => {
    it('should return null for empty queue', () => {
      expect(queue.peek()).toBeNull();
    });

    it('should return highest priority event without removing it', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.LOW);
      queue.enqueue(createEvent(EventType.RISK_CHANGED), EventPriority.CRITICAL);

      const peeked = queue.peek();
      expect(peeked?.event.type).toBe(EventType.RISK_CHANGED);
      expect(queue.size()).toBe(2);

      // Dequeue should return same event
      const dequeued = queue.dequeue();
      expect(dequeued?.event.type).toBe(EventType.RISK_CHANGED);
    });
  });

  describe('size', () => {
    it('should return 0 for empty queue', () => {
      expect(queue.size()).toBe(0);
    });

    it('should accurately track queue size', () => {
      expect(queue.size()).toBe(0);
      queue.enqueue(createEvent());
      expect(queue.size()).toBe(1);
      queue.enqueue(createEvent());
      expect(queue.size()).toBe(2);
      queue.dequeue();
      expect(queue.size()).toBe(1);
      queue.clear();
      expect(queue.size()).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false for non-empty queue', () => {
      queue.enqueue(createEvent());
      expect(queue.isEmpty()).toBe(false);
    });

    it('should return true after clearing', () => {
      queue.enqueue(createEvent());
      queue.clear();
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      queue.enqueue(createEvent());
      queue.enqueue(createEvent());
      queue.enqueue(createEvent());

      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.dequeue()).toBeNull();
    });
  });

  describe('priority ordering', () => {
    it('should process CRITICAL before HIGH', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.HIGH);
      queue.enqueue(createEvent(EventType.RISK_CHANGED), EventPriority.CRITICAL);

      const first = queue.dequeue();
      expect(first?.priority).toBe(EventPriority.CRITICAL);
    });

    it('should process HIGH before NORMAL', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.NORMAL);
      queue.enqueue(createEvent(EventType.RISK_CHANGED), EventPriority.HIGH);

      const first = queue.dequeue();
      expect(first?.priority).toBe(EventPriority.HIGH);
    });

    it('should process NORMAL before LOW', () => {
      queue.enqueue(createEvent(EventType.PERSON_UPDATED), EventPriority.LOW);
      queue.enqueue(createEvent(EventType.RISK_CHANGED), EventPriority.NORMAL);

      const first = queue.dequeue();
      expect(first?.priority).toBe(EventPriority.NORMAL);
    });

    it('should handle mixed priorities correctly', () => {
      queue.enqueue(createEvent(), EventPriority.LOW);
      queue.enqueue(createEvent(), EventPriority.NORMAL);
      queue.enqueue(createEvent(), EventPriority.CRITICAL);
      queue.enqueue(createEvent(), EventPriority.HIGH);
      queue.enqueue(createEvent(), EventPriority.NORMAL);

      const priorities: EventPriority[] = [];
      while (!queue.isEmpty()) {
        const event = queue.dequeue();
        if (event) priorities.push(event.priority);
      }

      expect(priorities).toEqual([
        EventPriority.CRITICAL,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.NORMAL,
        EventPriority.LOW,
      ]);
    });
  });

  describe('queued event structure', () => {
    it('should include all required fields', () => {
      const event = createEvent();
      queue.enqueue(event, EventPriority.HIGH);

      const dequeued = queue.dequeue();

      expect(dequeued).toBeDefined();
      expect(dequeued?.event).toEqual(event);
      expect(dequeued?.priority).toBe(EventPriority.HIGH);
      expect(dequeued?.enqueuedAt).toBeInstanceOf(Date);
    });

    it('should preserve event timestamp', () => {
      const timestamp = new Date('2024-01-15');
      const event: BaseEvent = {
        type: EventType.PERSON_UPDATED,
        timestamp,
        payload: {},
      };

      queue.enqueue(event);
      const dequeued = queue.dequeue();

      expect(dequeued?.event.timestamp).toEqual(timestamp);
    });
  });
});
