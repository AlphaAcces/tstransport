/**
 * Event Rules Tests
 *
 * Tests for the rule engine that evaluates conditions
 * and executes actions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EventRulesEngine,
  createRule,
} from '../core/eventRules';
import { EventType, type BaseEvent } from '../types';

describe('EventRulesEngine', () => {
  let engine: EventRulesEngine;

  const createEvent = (
    type: EventType = EventType.RISK_CHANGED,
    payload: Record<string, unknown> = {}
  ): BaseEvent => ({
    type,
    timestamp: new Date(),
    payload,
  });

  beforeEach(() => {
    engine = new EventRulesEngine();
  });

  describe('rule registration', () => {
    it('should register a rule', () => {
      const rule = createRule('test-rule', 'Test Rule', '*')
        .condition('payload.value', 'equals', 100)
        .action('log')
        .build();

      engine.registerRule(rule);

      expect(engine.getRuleCount()).toBe(1);
      expect(engine.getRule('test-rule')).toBeDefined();
    });

    it('should unregister a rule', () => {
      const rule = createRule('test-rule', 'Test Rule', '*').build();
      engine.registerRule(rule);

      const result = engine.unregisterRule('test-rule');

      expect(result).toBe(true);
      expect(engine.getRuleCount()).toBe(0);
      expect(engine.getRule('test-rule')).toBeUndefined();
    });

    it('should return false when unregistering non-existent rule', () => {
      const result = engine.unregisterRule('non-existent');
      expect(result).toBe(false);
    });

    it('should clear all rules', () => {
      engine.registerRule(createRule('rule-1', 'Rule 1', '*').build());
      engine.registerRule(createRule('rule-2', 'Rule 2', '*').build());

      engine.clearRules();

      expect(engine.getRuleCount()).toBe(0);
    });
  });

  describe('rule enabling/disabling', () => {
    it('should enable a rule', () => {
      const rule = createRule('test-rule', 'Test Rule', '*').disabled().build();
      engine.registerRule(rule);

      const result = engine.setRuleEnabled('test-rule', true);

      expect(result).toBe(true);
      expect(engine.getRule('test-rule')?.enabled).toBe(true);
    });

    it('should disable a rule', () => {
      const rule = createRule('test-rule', 'Test Rule', '*').build();
      engine.registerRule(rule);

      const result = engine.setRuleEnabled('test-rule', false);

      expect(result).toBe(true);
      expect(engine.getRule('test-rule')?.enabled).toBe(false);
    });

    it('should return false for non-existent rule', () => {
      const result = engine.setRuleEnabled('non-existent', true);
      expect(result).toBe(false);
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate equals condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.status', 'equals', 'active')
        .action('log')
        .build();

      engine.registerRule(rule);

      const matchingEvent = createEvent(EventType.RISK_CHANGED, { status: 'active' });
      const result = engine.evaluateConditions(matchingEvent, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate notEquals condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.status', 'notEquals', 'active')
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, { status: 'inactive' });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate greaterThan condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.score', 'greaterThan', 50)
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, { score: 75 });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate lessThan condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.score', 'lessThan', 50)
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, { score: 25 });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate contains condition for strings', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.message', 'contains', 'error')
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, { message: 'An error occurred' });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate contains condition for arrays', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.tags', 'contains', 'urgent')
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, { tags: ['urgent', 'review'] });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });

    it('should evaluate exists condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.data', 'exists')
        .action('log')
        .build();

      engine.registerRule(rule);

      const eventWithData = createEvent(EventType.RISK_CHANGED, { data: {} });
      const eventWithoutData = createEvent(EventType.RISK_CHANGED, {});

      expect(engine.evaluateConditions(eventWithData, rule).matched).toBe(true);
      expect(engine.evaluateConditions(eventWithoutData, rule).matched).toBe(false);
    });

    it('should evaluate notExists condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.data', 'notExists')
        .action('log')
        .build();

      engine.registerRule(rule);

      const eventWithData = createEvent(EventType.RISK_CHANGED, { data: {} });
      const eventWithoutData = createEvent(EventType.RISK_CHANGED, {});

      expect(engine.evaluateConditions(eventWithData, rule).matched).toBe(false);
      expect(engine.evaluateConditions(eventWithoutData, rule).matched).toBe(true);
    });

    it('should evaluate matches (regex) condition', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.email', 'matches', '^[a-z]+@test\\.com$')
        .action('log')
        .build();

      engine.registerRule(rule);

      const matchingEvent = createEvent(EventType.RISK_CHANGED, { email: 'user@test.com' });
      const nonMatchingEvent = createEvent(EventType.RISK_CHANGED, { email: 'user@other.com' });

      expect(engine.evaluateConditions(matchingEvent, rule).matched).toBe(true);
      expect(engine.evaluateConditions(nonMatchingEvent, rule).matched).toBe(false);
    });

    it('should require all conditions to match (AND logic)', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.status', 'equals', 'active')
        .condition('payload.score', 'greaterThan', 50)
        .action('log')
        .build();

      engine.registerRule(rule);

      const matchingEvent = createEvent(EventType.RISK_CHANGED, {
        status: 'active',
        score: 75,
      });
      const partialMatch = createEvent(EventType.RISK_CHANGED, {
        status: 'active',
        score: 25,
      });

      expect(engine.evaluateConditions(matchingEvent, rule).matched).toBe(true);
      expect(engine.evaluateConditions(partialMatch, rule).matched).toBe(false);
    });

    it('should handle nested payload paths', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('payload.data.nested.value', 'equals', 'found')
        .action('log')
        .build();

      engine.registerRule(rule);

      const event = createEvent(EventType.RISK_CHANGED, {
        data: { nested: { value: 'found' } },
      });
      const result = engine.evaluateConditions(event, rule);

      expect(result.matched).toBe(true);
    });
  });

  describe('event type filtering', () => {
    it('should match wildcard event types', async () => {
      const rule = createRule('test', 'Test', '*')
        .action('log')
        .build();

      engine.registerRule(rule);

      const results = await engine.evaluate(createEvent(EventType.PERSON_UPDATED));
      expect(results.some(r => r.matched)).toBe(true);
    });

    it('should match specific event types', async () => {
      const rule = createRule('test', 'Test', [EventType.RISK_CHANGED])
        .action('log')
        .build();

      engine.registerRule(rule);

      const matchingResults = await engine.evaluate(createEvent(EventType.RISK_CHANGED));
      const nonMatchingResults = await engine.evaluate(createEvent(EventType.PERSON_UPDATED));

      expect(matchingResults.some(r => r.matched)).toBe(true);
      expect(nonMatchingResults.length).toBe(0); // Rule not evaluated
    });

    it('should match multiple event types', async () => {
      const rule = createRule('test', 'Test', [
        EventType.RISK_CHANGED,
        EventType.RISK_ALERT_CREATED,
      ])
        .action('log')
        .build();

      engine.registerRule(rule);

      const risk1 = await engine.evaluate(createEvent(EventType.RISK_CHANGED));
      const risk2 = await engine.evaluate(createEvent(EventType.RISK_ALERT_CREATED));
      const other = await engine.evaluate(createEvent(EventType.PERSON_UPDATED));

      expect(risk1.length).toBe(1);
      expect(risk2.length).toBe(1);
      expect(other.length).toBe(0);
    });
  });

  describe('action execution', () => {
    it('should execute log action', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const rule = createRule('test', 'Test Rule', '*')
        .action('log')
        .build();

      engine.registerRule(rule);
      await engine.evaluate(createEvent());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should track executed actions in results', async () => {
      const rule = createRule('test', 'Test', '*')
        .action('log')
        .action('suppress')
        .build();

      engine.registerRule(rule);
      const results = await engine.evaluate(createEvent());

      expect(results[0].actionsExecuted).toContain('log');
      expect(results[0].actionsExecuted).toContain('suppress');
    });

    it('should call custom action handler', async () => {
      const customHandler = vi.fn();
      engine.registerActionHandler('custom', customHandler);

      const rule = createRule('test', 'Test', '*')
        .action('custom', { data: 'test' })
        .build();

      engine.registerRule(rule);
      await engine.evaluate(createEvent());

      expect(customHandler).toHaveBeenCalled();
    });
  });

  describe('rule priority', () => {
    it('should evaluate rules in priority order', async () => {
      const executionOrder: string[] = [];

      engine.registerActionHandler('custom', async (_event, rule) => {
        executionOrder.push(rule.id);
      });

      engine.registerRule(
        createRule('low-priority', 'Low', '*')
          .priority(100)
          .action('custom')
          .build()
      );

      engine.registerRule(
        createRule('high-priority', 'High', '*')
          .priority(10)
          .action('custom')
          .build()
      );

      engine.registerRule(
        createRule('medium-priority', 'Medium', '*')
          .priority(50)
          .action('custom')
          .build()
      );

      await engine.evaluate(createEvent());

      expect(executionOrder).toEqual([
        'high-priority',
        'medium-priority',
        'low-priority',
      ]);
    });
  });

  describe('stop on match', () => {
    it('should stop processing when stopOnMatch is true', async () => {
      const executionOrder: string[] = [];

      engine.registerActionHandler('custom', async (_event, rule) => {
        executionOrder.push(rule.id);
      });

      engine.registerRule(
        createRule('first', 'First', '*')
          .priority(10)
          .action('custom')
          .stopOnMatch()
          .build()
      );

      engine.registerRule(
        createRule('second', 'Second', '*')
          .priority(20)
          .action('custom')
          .build()
      );

      await engine.evaluate(createEvent());

      expect(executionOrder).toEqual(['first']);
    });
  });

  describe('rule builder', () => {
    it('should create rule with description', () => {
      const rule = createRule('test', 'Test', '*')
        .description('A test rule')
        .build();

      expect(rule.description).toBe('A test rule');
    });

    it('should create disabled rule', () => {
      const rule = createRule('test', 'Test', '*')
        .disabled()
        .build();

      expect(rule.enabled).toBe(false);
    });

    it('should set priority', () => {
      const rule = createRule('test', 'Test', '*')
        .priority(5)
        .build();

      expect(rule.priority).toBe(5);
    });

    it('should add multiple conditions', () => {
      const rule = createRule('test', 'Test', '*')
        .condition('field1', 'equals', 'value1')
        .condition('field2', 'greaterThan', 100)
        .build();

      expect(rule.conditions.length).toBe(2);
    });

    it('should add multiple actions', () => {
      const rule = createRule('test', 'Test', '*')
        .action('log')
        .action('notify', { level: 'high' })
        .build();

      expect(rule.actions.length).toBe(2);
      expect(rule.actions[1].config.level).toBe('high');
    });
  });

  describe('error handling', () => {
    it('should capture action errors in results', async () => {
      engine.registerActionHandler('custom', async () => {
        throw new Error('Action failed');
      });

      const rule = createRule('test', 'Test', '*')
        .action('custom')
        .build();

      engine.registerRule(rule);
      const results = await engine.evaluate(createEvent());

      expect(results[0].errors.length).toBeGreaterThan(0);
      expect(results[0].errors[0]).toContain('Action custom failed');
    });

    it('should continue processing other rules on error', async () => {
      // First rule will throw
      const failingHandler = vi.fn().mockRejectedValue(new Error('Failed'));

      // Second rule uses escalate which should work
      const escalateHandler = vi.fn().mockResolvedValue(undefined);

      engine.registerActionHandler('custom', failingHandler);
      engine.registerActionHandler('escalate', escalateHandler);

      engine.registerRule(
        createRule('failing-rule', 'Failing', '*')
          .priority(10)
          .action('custom')
          .build()
      );

      engine.registerRule(
        createRule('succeeding-rule', 'Succeeding', '*')
          .priority(20)
          .action('escalate')
          .build()
      );

      await engine.evaluate(createEvent());

      expect(escalateHandler).toHaveBeenCalled();
    });
  });
});
