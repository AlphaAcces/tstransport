/**
 * Event Core Module
 *
 * Re-exports all core event processing components.
 */

// Queue
export {
  EventQueue,
  EventPriority,
  type QueuedEvent,
} from './eventQueue';

// Rules Engine
export {
  EventRulesEngine,
  RuleBuilder,
  createRule,
  eventRules,
  type ConditionOperator,
  type RuleCondition,
  type RuleActionType,
  type RuleAction,
  type EventRule,
  type RuleMatchResult,
  type RuleExecutionResult,
  type ActionHandler,
} from './eventRules';

// Processor
export {
  EventProcessor,
  createEventProcessor,
  eventProcessor,
  type ProcessableEvent,
  type ProcessorEventHandler,
  type HandlerRegistration,
  type ProcessorConfig,
  type ProcessingResult,
  type ProcessorStats,
} from './eventProcessor';
