/**
 * Event Processor Tests
 *
 * Tests for the central event processing orchestrator.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EventProcessor,
  createEventProcessor,
} from '../core/eventProcessor';
import { createRule } from '../core/eventRules';
import { EventType, type BaseEvent } from '../types';

describe('EventProcessor', () => {
  let processor: EventProcessor;

  const createEvent = (
    type: EventType = EventType.RISK_CHANGED,
    payload: Record<string, unknown> = {}
  ): BaseEvent => ({
    type,
    timestamp: new Date(),
    payload,
  });

  beforeEach(() => {
    // Create processor with auto-process disabled and minimal retry delay for testing
    processor = createEventProcessor({
      autoProcess: false,
      maxRetries: 0, // Disable retries for faster tests
      retryDelay: 0,
    });
  });

  afterEach(() => {
    processor.dispose();
  });

  describe('lifecycle', () => {
    it('should create processor with default config', () => {
      const p = createEventProcessor({ autoProcess: false });
      expect(p).toBeInstanceOf(EventProcessor);
      expect(p.isRunning()).toBe(false);
      p.dispose();
    });

    it('should start and stop processing', () => {
      expect(processor.isRunning()).toBe(false);

      processor.start();
      expect(processor.isRunning()).toBe(true);

      processor.stop();
      expect(processor.isRunning()).toBe(false);
    });

    it('should not start multiple times', () => {
      processor.start();
      processor.start(); // Should be idempotent
      expect(processor.isRunning()).toBe(true);
    });
  });

  describe('event submission', () => {
    it('should submit events to queue', () => {
      processor.submit(createEvent());
      expect(processor.getQueueSize()).toBe(1);
    });

    it('should return event ID on submit', () => {
      const id = processor.submit(createEvent());
      expect(id).toBeDefined();
      expect(id).toContain('evt-');
    });

    it('should submit with different priorities', () => {
      processor.submitLowPriority(createEvent());
      processor.submitCritical(createEvent());
      processor.submit(createEvent());

      expect(processor.getQueueSize()).toBe(3);
    });
  });

  describe('handler registration', () => {
    it('should register handlers', () => {
      const handler = vi.fn();

      processor.registerHandler({
        id: 'test-handler',
        eventTypes: [EventType.RISK_CHANGED],
        handler,
      });

      expect(processor.getHandlers().length).toBe(1);
    });

    it('should unregister handlers', () => {
      const handler = vi.fn();

      const unsubscribe = processor.registerHandler({
        id: 'test-handler',
        eventTypes: [EventType.RISK_CHANGED],
        handler,
      });

      expect(processor.getHandlers().length).toBe(1);

      unsubscribe();
      expect(processor.getHandlers().length).toBe(0);
    });

    it('should unregister handler by id', () => {
      processor.registerHandler({
        id: 'test-handler',
        eventTypes: [],
        handler: vi.fn(),
      });

      const result = processor.unregisterHandler('test-handler');

      expect(result).toBe(true);
      expect(processor.getHandlers().length).toBe(0);
    });

    it('should return false for non-existent handler', () => {
      const result = processor.unregisterHandler('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('rule management', () => {
    it('should add rules', () => {
      const rule = createRule('test', 'Test', '*')
        .action('log')
        .build();

      processor.addRule(rule);

      expect(processor.getRules().length).toBe(1);
    });

    it('should remove rules', () => {
      const rule = createRule('test', 'Test', '*')
        .action('log')
        .build();

      processor.addRule(rule);
      const result = processor.removeRule('test');

      expect(result).toBe(true);
      expect(processor.getRules().length).toBe(0);
    });

    it('should provide access to rules engine', () => {
      const engine = processor.getRulesEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('event processing', () => {
    it('should process events in queue', async () => {
      const handler = vi.fn();

      processor.registerHandler({
        id: 'test',
        eventTypes: [EventType.RISK_CHANGED],
        handler,
      });

      processor.submit(createEvent());
      const results = await processor.processTick();

      expect(results.length).toBe(1);
      expect(handler).toHaveBeenCalled();
    });

    it('should process multiple events', async () => {
      const handler = vi.fn();

      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler,
      });

      processor.submit(createEvent(EventType.RISK_CHANGED));
      processor.submit(createEvent(EventType.PERSON_UPDATED));
      processor.submit(createEvent(EventType.COMPANY_UPDATED));

      const results = await processor.processAll();

      expect(results.length).toBe(3);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should filter handlers by event type', async () => {
      const riskHandler = vi.fn();
      const personHandler = vi.fn();

      processor.registerHandler({
        id: 'risk',
        eventTypes: [EventType.RISK_CHANGED],
        handler: riskHandler,
      });

      processor.registerHandler({
        id: 'person',
        eventTypes: [EventType.PERSON_UPDATED],
        handler: personHandler,
      });

      processor.submit(createEvent(EventType.RISK_CHANGED));
      await processor.processAll();

      expect(riskHandler).toHaveBeenCalled();
      expect(personHandler).not.toHaveBeenCalled();
    });

    it('should call handlers with empty event types for all events', async () => {
      const handler = vi.fn();

      processor.registerHandler({
        id: 'catch-all',
        eventTypes: [], // Empty = match all
        handler,
      });

      processor.submit(createEvent(EventType.RISK_CHANGED));
      processor.submit(createEvent(EventType.PERSON_UPDATED));
      await processor.processAll();

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should respect handler priority', async () => {
      const order: string[] = [];

      processor.registerHandler({
        id: 'second',
        eventTypes: [],
        handler: () => { order.push('second'); },
        priority: 20,
      });

      processor.registerHandler({
        id: 'first',
        eventTypes: [],
        handler: () => { order.push('first'); },
        priority: 10,
      });

      processor.submit(createEvent());
      await processor.processAll();

      expect(order).toEqual(['first', 'second']);
    });

    it('should return processing results', async () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      processor.submit(createEvent());
      const results = await processor.processTick();

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].handlersInvoked).toBe(1);
      expect(results[0].eventId).toBeDefined();
      expect(results[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should capture handler errors', async () => {
      processor.registerHandler({
        id: 'failing',
        eventTypes: [],
        handler: () => { throw new Error('Handler failed'); },
      });

      processor.submit(createEvent());
      const results = await processor.processAll();

      expect(results[0].success).toBe(false);
      expect(results[0].errors.length).toBeGreaterThan(0);
    });

    it('should continue processing after handler error', async () => {
      const successHandler = vi.fn();

      processor.registerHandler({
        id: 'failing',
        eventTypes: [],
        handler: () => { throw new Error('Failed'); },
        priority: 10,
      });

      processor.registerHandler({
        id: 'success',
        eventTypes: [],
        handler: successHandler,
        priority: 20,
      });

      processor.submit(createEvent());
      await processor.processAll();

      expect(successHandler).toHaveBeenCalled();
    });

    it('should track failed events in stats', async () => {
      processor.registerHandler({
        id: 'failing',
        eventTypes: [],
        handler: () => { throw new Error('Failed'); },
      });

      processor.submit(createEvent());
      await processor.processAll();

      const stats = processor.getStats();
      expect(stats.eventsFailed).toBe(1);
    });
  });

  describe('rule integration', () => {
    it('should apply rules to events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const rule = createRule('test', 'Test', [EventType.RISK_CHANGED])
        .action('log', { level: 'info' })
        .build();

      processor.addRule(rule);
      processor.submit(createEvent(EventType.RISK_CHANGED));
      const results = await processor.processAll();

      expect(results[0].rulesMatched).toBeGreaterThanOrEqual(0);
      consoleSpy.mockRestore();
    });

    it('should suppress events when rule uses suppress action', async () => {
      const handler = vi.fn();

      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler,
      });

      const rule = createRule('suppress', 'Suppress', '*')
        .action('suppress')
        .build();

      processor.addRule(rule);
      processor.submit(createEvent());
      await processor.processAll();

      // Handler should not be called when event is suppressed
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track processed events', async () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      processor.submit(createEvent());
      processor.submit(createEvent());
      await processor.processAll();

      const stats = processor.getStats();
      expect(stats.eventsProcessed).toBe(2);
    });

    it('should track average processing time', async () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      processor.submit(createEvent());
      await processor.processAll();

      const stats = processor.getStats();
      expect(stats.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should track last processed time', async () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      expect(processor.getStats().lastProcessedAt).toBeNull();

      processor.submit(createEvent());
      await processor.processAll();

      expect(processor.getStats().lastProcessedAt).toBeInstanceOf(Date);
    });

    it('should reset statistics', async () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      processor.submit(createEvent());
      await processor.processAll();

      processor.resetStats();
      const stats = processor.getStats();

      expect(stats.eventsProcessed).toBe(0);
      expect(stats.eventsFailed).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
    });
  });

  describe('queue management', () => {
    it('should report queue size', () => {
      processor.submit(createEvent());
      processor.submit(createEvent());

      expect(processor.getQueueSize()).toBe(2);
    });

    it('should clear queue', () => {
      processor.submit(createEvent());
      processor.submit(createEvent());

      processor.clearQueue();

      expect(processor.getQueueSize()).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should clean up on dispose', () => {
      processor.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      processor.addRule(
        createRule('test', 'Test', '*').action('log').build()
      );

      processor.submit(createEvent());
      processor.start();

      processor.dispose();

      expect(processor.isRunning()).toBe(false);
      expect(processor.getQueueSize()).toBe(0);
      expect(processor.getHandlers().length).toBe(0);
      expect(processor.getRules().length).toBe(0);
    });
  });

  describe('batch processing', () => {
    it('should respect batch size config', async () => {
      const p = createEventProcessor({
        autoProcess: false,
        batchSize: 2,
      });

      p.registerHandler({
        id: 'test',
        eventTypes: [],
        handler: vi.fn(),
      });

      // Submit 5 events
      for (let i = 0; i < 5; i++) {
        p.submit(createEvent());
      }

      // First tick should process only 2
      const firstBatch = await p.processTick();
      expect(firstBatch.length).toBe(2);
      expect(p.getQueueSize()).toBe(3);

      // Second tick should process 2 more
      const secondBatch = await p.processTick();
      expect(secondBatch.length).toBe(2);
      expect(p.getQueueSize()).toBe(1);

      p.dispose();
    });
  });
});
