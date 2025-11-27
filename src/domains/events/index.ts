/**
 * Events Domain
 *
 * Comprehensive event system for real-time updates
 * across the application.
 */

// Event Bus
export { eventBus, createEvent } from './eventBus';

// Types
export { EventType } from './types';
export type {
  BaseEvent,
  EventHandler,
  EventSubscription,
  PersonUpdatedEvent,
  CompanyUpdatedEvent,
  TimelineAddedEvent,
  RiskChangedEvent,
  ConnectionStatusChangedEvent,
  AppEvent,
} from './types';

// Core
export * from './core';

// Connectors
export * from './connectors';

// Handlers
export * from './handlers';
