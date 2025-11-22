/**
 * Event System Types
 *
 * Defines typed events for real-time updates across the application.
 * Each event type carries specific payload data for the update.
 */

/**
 * Available event types for the event bus
 */
export enum EventType {
  // Person & Network Events
  PERSON_UPDATED = 'person:updated',
  PERSON_NETWORK_CHANGED = 'person:network:changed',

  // Company Events
  COMPANY_UPDATED = 'company:updated',
  COMPANY_OWNERSHIP_CHANGED = 'company:ownership:changed',

  // Timeline Events
  TIMELINE_ADDED = 'timeline:added',
  TIMELINE_UPDATED = 'timeline:updated',
  TIMELINE_DELETED = 'timeline:deleted',

  // Risk Events
  RISK_CHANGED = 'risk:changed',
  RISK_ALERT_CREATED = 'risk:alert:created',

  // Financial Events
  FINANCIAL_UPDATED = 'financial:updated',
  CASHFLOW_UPDATED = 'cashflow:updated',

  // Hypothesis Events
  HYPOTHESIS_CREATED = 'hypothesis:created',
  HYPOTHESIS_UPDATED = 'hypothesis:updated',
  HYPOTHESIS_VERIFIED = 'hypothesis:verified',

  // Action Events
  ACTION_CREATED = 'action:created',
  ACTION_COMPLETED = 'action:completed',
  ACTION_ASSIGNED = 'action:assigned',

  // System Events
  DATA_REFRESH = 'system:data:refresh',
  CONNECTION_STATUS_CHANGED = 'system:connection:changed',
}

/**
 * Base event interface
 */
export interface BaseEvent<T = unknown> {
  type: EventType;
  timestamp: Date;
  payload: T;
}

/**
 * Person update event
 */
export interface PersonUpdatedEvent extends BaseEvent<{
  personId: string;
  changes: Partial<{
    name: string;
    role: string;
    background: string;
    keyFindings: string[];
  }>;
}> {
  type: EventType.PERSON_UPDATED;
}

/**
 * Company update event
 */
export interface CompanyUpdatedEvent extends BaseEvent<{
  companyId: string;
  changes: Partial<{
    name: string;
    revenue: number;
    employees: number;
    ownership: unknown;
  }>;
}> {
  type: EventType.COMPANY_UPDATED;
}

/**
 * Timeline event added
 */
export interface TimelineAddedEvent extends BaseEvent<{
  event: {
    id: string;
    date: string;
    title: string;
    description: string;
    category: string;
    impact: string;
  };
}> {
  type: EventType.TIMELINE_ADDED;
}

/**
 * Risk level changed
 */
export interface RiskChangedEvent extends BaseEvent<{
  category: string;
  oldLevel: string;
  newLevel: string;
  reason: string;
}> {
  type: EventType.RISK_CHANGED;
}

/**
 * Connection status changed
 */
export interface ConnectionStatusChangedEvent extends BaseEvent<{
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  message?: string;
}> {
  type: EventType.CONNECTION_STATUS_CHANGED;
}

/**
 * Union type of all possible events
 */
export type AppEvent =
  | PersonUpdatedEvent
  | CompanyUpdatedEvent
  | TimelineAddedEvent
  | RiskChangedEvent
  | ConnectionStatusChangedEvent
  | BaseEvent;

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: BaseEvent<T>) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe: () => void;
}
