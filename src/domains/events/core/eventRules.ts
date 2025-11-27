/**
 * Event Rules Engine
 *
 * Defines and evaluates rules that determine when and how
 * events should trigger actions. Supports:
 * - Condition-based rule matching
 * - Action execution
 * - Rule priorities
 * - Rule chaining
 */

import type { BaseEvent, EventType } from '../types';

/**
 * Rule condition operators
 */
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'matches'
  | 'exists'
  | 'notExists';

/**
 * Single condition in a rule
 */
export interface RuleCondition {
  field: string; // dot-notation path into event.payload
  operator: ConditionOperator;
  value?: unknown;
}

/**
 * Actions that can be triggered by rules
 */
export type RuleActionType =
  | 'notify'
  | 'escalate'
  | 'log'
  | 'transform'
  | 'suppress'
  | 'emit'
  | 'custom';

/**
 * Action configuration
 */
export interface RuleAction {
  type: RuleActionType;
  config: Record<string, unknown>;
}

/**
 * Event rule definition
 */
export interface EventRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number; // Lower = higher priority

  // Event matching
  eventTypes: EventType[] | '*';

  // Conditions (all must match - AND logic)
  conditions: RuleCondition[];

  // Actions to execute when rule matches
  actions: RuleAction[];

  // Optional: stop processing further rules
  stopOnMatch?: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rule match result
 */
export interface RuleMatchResult {
  rule: EventRule;
  matched: boolean;
  conditionResults: Array<{
    condition: RuleCondition;
    matched: boolean;
    actualValue?: unknown;
  }>;
}

/**
 * Rule execution result
 */
export interface RuleExecutionResult {
  ruleId: string;
  matched: boolean;
  actionsExecuted: RuleActionType[];
  errors: string[];
  duration: number;
}

/**
 * Action handler function type
 */
export type ActionHandler = (
  event: BaseEvent,
  rule: EventRule,
  action: RuleAction
) => Promise<void>;

/**
 * Event Rules Engine
 */
export class EventRulesEngine {
  private rules: Map<string, EventRule> = new Map();
  private actionHandlers: Map<RuleActionType, ActionHandler> = new Map();

  constructor() {
    // Register default action handlers
    this.registerDefaultHandlers();
  }

  /**
   * Register a rule
   */
  registerRule(rule: EventRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Unregister a rule
   */
  unregisterRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Register a custom action handler
   */
  registerActionHandler(type: RuleActionType, handler: ActionHandler): void {
    this.actionHandlers.set(type, handler);
  }

  /**
   * Evaluate all rules against an event
   */
  async evaluate(event: BaseEvent): Promise<RuleExecutionResult[]> {
    const results: RuleExecutionResult[] = [];

    // Get matching rules sorted by priority
    const sortedRules = this.getMatchingRules(event);

    for (const rule of sortedRules) {
      const startTime = performance.now();
      const result: RuleExecutionResult = {
        ruleId: rule.id,
        matched: false,
        actionsExecuted: [],
        errors: [],
        duration: 0,
      };

      try {
        // Check conditions
        const matchResult = this.evaluateConditions(event, rule);
        result.matched = matchResult.matched;

        if (matchResult.matched) {
          // Execute actions
          for (const action of rule.actions) {
            try {
              await this.executeAction(event, rule, action);
              result.actionsExecuted.push(action.type);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              result.errors.push(`Action ${action.type} failed: ${message}`);
            }
          }

          // Check if we should stop processing
          if (rule.stopOnMatch) {
            result.duration = performance.now() - startTime;
            results.push(result);
            break;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Rule evaluation failed: ${message}`);
      }

      result.duration = performance.now() - startTime;
      results.push(result);
    }

    return results;
  }

  /**
   * Get rules that could apply to an event type
   */
  private getMatchingRules(event: BaseEvent): EventRule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        if (!rule.enabled) return false;
        if (rule.eventTypes === '*') return true;
        return rule.eventTypes.includes(event.type);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate all conditions for a rule
   */
  evaluateConditions(event: BaseEvent, rule: EventRule): RuleMatchResult {
    const conditionResults = rule.conditions.map(condition => {
      const actualValue = this.getNestedValue(event, condition.field);
      const matched = this.evaluateCondition(condition, actualValue);
      return { condition, matched, actualValue };
    });

    return {
      rule,
      matched: conditionResults.every(r => r.matched),
      conditionResults,
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, actualValue: unknown): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return actualValue === value;

      case 'notEquals':
        return actualValue !== value;

      case 'contains':
        if (typeof actualValue === 'string' && typeof value === 'string') {
          return actualValue.includes(value);
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(value);
        }
        return false;

      case 'greaterThan':
        return typeof actualValue === 'number' && typeof value === 'number'
          ? actualValue > value
          : false;

      case 'lessThan':
        return typeof actualValue === 'number' && typeof value === 'number'
          ? actualValue < value
          : false;

      case 'greaterThanOrEqual':
        return typeof actualValue === 'number' && typeof value === 'number'
          ? actualValue >= value
          : false;

      case 'lessThanOrEqual':
        return typeof actualValue === 'number' && typeof value === 'number'
          ? actualValue <= value
          : false;

      case 'matches':
        if (typeof actualValue === 'string' && typeof value === 'string') {
          try {
            const regex = new RegExp(value);
            return regex.test(actualValue);
          } catch {
            return false;
          }
        }
        return false;

      case 'exists':
        return actualValue !== undefined && actualValue !== null;

      case 'notExists':
        return actualValue === undefined || actualValue === null;

      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Execute an action
   */
  private async executeAction(
    event: BaseEvent,
    rule: EventRule,
    action: RuleAction
  ): Promise<void> {
    const handler = this.actionHandlers.get(action.type);
    if (handler) {
      await handler(event, rule, action);
    } else {
      console.warn(`[EventRules] No handler for action type: ${action.type}`);
    }
  }

  /**
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    // Log action
    this.registerActionHandler('log', async (event, rule, action) => {
      const level = (action.config.level as string) ?? 'info';
      const message = `[Rule: ${rule.name}] Event ${event.type}`;

      switch (level) {
        case 'error':
          console.error(message, event.payload);
          break;
        case 'warn':
          console.warn(message, event.payload);
          break;
        default:
          console.log(message, event.payload);
      }
    });

    // Suppress action (just marks as handled, does nothing)
    this.registerActionHandler('suppress', async () => {
      // Intentionally empty - suppresses further processing
    });
  }

  /**
   * Get all registered rules
   */
  getRules(): EventRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get a specific rule
   */
  getRule(ruleId: string): EventRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Get rule count
   */
  getRuleCount(): number {
    return this.rules.size;
  }
}

/**
 * Create a rule builder for easier rule construction
 */
export function createRule(
  id: string,
  name: string,
  eventTypes: EventType[] | '*'
): RuleBuilder {
  return new RuleBuilder(id, name, eventTypes);
}

/**
 * Rule builder for fluent API
 */
export class RuleBuilder {
  private rule: EventRule;

  constructor(id: string, name: string, eventTypes: EventType[] | '*') {
    this.rule = {
      id,
      name,
      enabled: true,
      priority: 100,
      eventTypes,
      conditions: [],
      actions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  description(desc: string): this {
    this.rule.description = desc;
    return this;
  }

  priority(p: number): this {
    this.rule.priority = p;
    return this;
  }

  condition(field: string, operator: ConditionOperator, value?: unknown): this {
    this.rule.conditions.push({ field, operator, value });
    return this;
  }

  action(type: RuleActionType, config: Record<string, unknown> = {}): this {
    this.rule.actions.push({ type, config });
    return this;
  }

  stopOnMatch(stop = true): this {
    this.rule.stopOnMatch = stop;
    return this;
  }

  disabled(): this {
    this.rule.enabled = false;
    return this;
  }

  build(): EventRule {
    return this.rule;
  }
}

// Default singleton instance
export const eventRules = new EventRulesEngine();
