/**
 * Event Processor
 *
 * Central orchestrator for the event engine. Receives events,
 * applies rules, manages the queue, and dispatches to handlers.
 */

import { EventType, type BaseEvent } from '../types';
import { EventQueue, EventPriority, type QueuedEvent } from './eventQueue';
import {
  EventRulesEngine,
  type EventRule,
  type RuleExecutionResult,
} from './eventRules';

// ============================================================================
// Types
// ============================================================================

/** Extended event with ID for processing */
export interface ProcessableEvent extends BaseEvent {
  id: string;
}

/** Handler function signature */
export type ProcessorEventHandler<T extends ProcessableEvent = ProcessableEvent> = (
  event: T
) => void | Promise<void>;

/** Handler registration */
export interface HandlerRegistration {
  id: string;
  eventTypes: EventType[];
  handler: ProcessorEventHandler;
  priority?: number;
}

/** Processor configuration */
export interface ProcessorConfig {
  /** Maximum events to process per tick */
  batchSize: number;
  /** Interval between processing ticks (ms) */
  tickInterval: number;
  /** Maximum retries for failed handlers */
  maxRetries: number;
  /** Delay between retries (ms) */
  retryDelay: number;
  /** Enable automatic processing */
  autoProcess: boolean;
}

/** Processing result */
export interface ProcessingResult {
  eventId: string;
  success: boolean;
  handlersInvoked: number;
  rulesMatched: number;
  errors: Error[];
  duration: number;
}

/** Processor statistics */
export interface ProcessorStats {
  eventsProcessed: number;
  eventsQueued: number;
  eventsFailed: number;
  handlersRegistered: number;
  rulesActive: number;
  averageProcessingTime: number;
  lastProcessedAt: Date | null;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ProcessorConfig = {
  batchSize: 10,
  tickInterval: 100,
  maxRetries: 3,
  retryDelay: 1000,
  autoProcess: true,
};

// ============================================================================
// Event Processor
// ============================================================================

export class EventProcessor {
  private queue: EventQueue;
  private rulesEngine: EventRulesEngine;
  private handlers: Map<string, HandlerRegistration> = new Map();
  private config: ProcessorConfig;
  private processingTimer: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;

  // Statistics
  private stats: ProcessorStats = {
    eventsProcessed: 0,
    eventsQueued: 0,
    eventsFailed: 0,
    handlersRegistered: 0,
    rulesActive: 0,
    averageProcessingTime: 0,
    lastProcessedAt: null,
  };

  private processingTimes: number[] = [];

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new EventQueue();
    this.rulesEngine = new EventRulesEngine();

    if (this.config.autoProcess) {
      this.start();
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Start automatic event processing */
  start(): void {
    if (this.processingTimer) return;

    this.processingTimer = setInterval(
      () => this.processTick(),
      this.config.tickInterval
    );
  }

  /** Stop automatic event processing */
  stop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /** Check if processor is running */
  isRunning(): boolean {
    return this.processingTimer !== null;
  }

  // --------------------------------------------------------------------------
  // Handler Management
  // --------------------------------------------------------------------------

  /** Register an event handler */
  registerHandler(registration: HandlerRegistration): () => void {
    this.handlers.set(registration.id, registration);
    this.stats.handlersRegistered = this.handlers.size;

    // Return unsubscribe function
    return () => this.unregisterHandler(registration.id);
  }

  /** Unregister an event handler */
  unregisterHandler(handlerId: string): boolean {
    const result = this.handlers.delete(handlerId);
    this.stats.handlersRegistered = this.handlers.size;
    return result;
  }

  /** Get all registered handlers */
  getHandlers(): HandlerRegistration[] {
    return Array.from(this.handlers.values());
  }

  // --------------------------------------------------------------------------
  // Rule Management
  // --------------------------------------------------------------------------

  /** Add a processing rule */
  addRule(rule: EventRule): void {
    this.rulesEngine.registerRule(rule);
    this.stats.rulesActive = this.rulesEngine.getRuleCount();
  }

  /** Remove a processing rule */
  removeRule(ruleId: string): boolean {
    const result = this.rulesEngine.unregisterRule(ruleId);
    this.stats.rulesActive = this.rulesEngine.getRuleCount();
    return result;
  }

  /** Get all rules */
  getRules(): EventRule[] {
    return this.rulesEngine.getRules();
  }

  /** Get the rules engine for direct access */
  getRulesEngine(): EventRulesEngine {
    return this.rulesEngine;
  }

  // --------------------------------------------------------------------------
  // Event Submission
  // --------------------------------------------------------------------------

  /** Generate a unique event ID */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Create a processable event from a base event */
  private toProcessableEvent(event: BaseEvent, id?: string): ProcessableEvent {
    return {
      ...event,
      id: id ?? this.generateEventId(),
    };
  }

  /** Submit an event for processing */
  submit(event: BaseEvent, priority: EventPriority = EventPriority.NORMAL): string {
    const processableEvent = this.toProcessableEvent(event);
    this.queue.enqueue(processableEvent, priority);
    this.stats.eventsQueued++;
    return processableEvent.id;
  }

  /** Submit a processable event directly */
  submitProcessable(event: ProcessableEvent, priority: EventPriority = EventPriority.NORMAL): void {
    this.queue.enqueue(event, priority);
    this.stats.eventsQueued++;
  }

  /** Submit a high-priority event */
  submitCritical(event: BaseEvent): string {
    return this.submit(event, EventPriority.CRITICAL);
  }

  /** Submit a low-priority event */
  submitLowPriority(event: BaseEvent): string {
    return this.submit(event, EventPriority.LOW);
  }

  // --------------------------------------------------------------------------
  // Processing
  // --------------------------------------------------------------------------

  /** Process a single tick (batch of events) */
  async processTick(): Promise<ProcessingResult[]> {
    if (this.isProcessing) return [];

    this.isProcessing = true;
    const results: ProcessingResult[] = [];

    try {
      for (let i = 0; i < this.config.batchSize; i++) {
        const queuedEvent = this.queue.dequeue();
        if (!queuedEvent) break;

        const result = await this.processEvent(queuedEvent);
        results.push(result);
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /** Process a single event */
  private async processEvent(queuedEvent: QueuedEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let handlersInvoked = 0;
    let rulesMatched = 0;

    // Cast to processable event for ID access
    const event = queuedEvent.event as ProcessableEvent;
    const eventId = event.id ?? this.generateEventId();

    try {
      // Apply rules (async evaluation)
      const ruleResults = await this.rulesEngine.evaluate(queuedEvent.event);
      rulesMatched = ruleResults.filter(r => r.matched).length;

      // Collect rule errors
      for (const result of ruleResults) {
        for (const error of result.errors) {
          errors.push(new Error(error));
        }
      }

      // Check if any rule suppressed the event
      const suppressed = this.isEventSuppressed(ruleResults);
      if (suppressed) {
        const duration = Date.now() - startTime;
        this.recordProcessingTime(duration);
        this.stats.eventsProcessed++;
        this.stats.lastProcessedAt = new Date();

        return {
          eventId,
          success: true,
          handlersInvoked: 0,
          rulesMatched,
          errors: [],
          duration,
        };
      }

      // Find matching handlers
      const matchingHandlers = this.getMatchingHandlers(queuedEvent.event);

      // Sort by priority
      matchingHandlers.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      // Execute handlers
      for (const registration of matchingHandlers) {
        try {
          await this.executeHandler(registration, event);
          handlersInvoked++;
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      const duration = Date.now() - startTime;
      this.recordProcessingTime(duration);

      if (errors.length > 0) {
        this.stats.eventsFailed++;
      } else {
        this.stats.eventsProcessed++;
      }

      this.stats.lastProcessedAt = new Date();

      return {
        eventId,
        success: errors.length === 0,
        handlersInvoked,
        rulesMatched,
        errors,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.eventsFailed++;

      return {
        eventId,
        success: false,
        handlersInvoked,
        rulesMatched,
        errors: [error instanceof Error ? error : new Error(String(error))],
        duration,
      };
    }
  }

  /** Check if any rule action suppressed the event */
  private isEventSuppressed(results: RuleExecutionResult[]): boolean {
    return results.some(
      r => r.matched && r.actionsExecuted.includes('suppress')
    );
  }

  /** Execute a handler with retry logic */
  private async executeHandler(
    registration: HandlerRegistration,
    event: ProcessableEvent
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        await registration.handler(event);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  /** Get handlers that match an event */
  private getMatchingHandlers(event: BaseEvent): HandlerRegistration[] {
    return Array.from(this.handlers.values()).filter(
      (registration) =>
        registration.eventTypes.length === 0 ||
        registration.eventTypes.includes(event.type)
    );
  }

  /** Force process all queued events immediately */
  async processAll(): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    while (this.queue.size() > 0) {
      const tickResults = await this.processTick();
      results.push(...tickResults);
    }

    return results;
  }

  /** Record processing time for statistics */
  private recordProcessingTime(duration: number): void {
    this.processingTimes.push(duration);

    // Keep only last 100 measurements
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    // Calculate average
    this.stats.averageProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /** Delay helper */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Statistics & Monitoring
  // --------------------------------------------------------------------------

  /** Get processor statistics */
  getStats(): ProcessorStats {
    return {
      ...this.stats,
      eventsQueued: this.queue.size(),
    };
  }

  /** Get queue size */
  getQueueSize(): number {
    return this.queue.size();
  }

  /** Clear the queue */
  clearQueue(): void {
    this.queue.clear();
  }

  /** Reset statistics */
  resetStats(): void {
    this.stats = {
      eventsProcessed: 0,
      eventsQueued: this.queue.size(),
      eventsFailed: 0,
      handlersRegistered: this.handlers.size,
      rulesActive: this.rulesEngine.getRuleCount(),
      averageProcessingTime: 0,
      lastProcessedAt: null,
    };
    this.processingTimes = [];
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  /** Dispose of the processor */
  dispose(): void {
    this.stop();
    this.queue.clear();
    this.handlers.clear();
    this.rulesEngine.clearRules();
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create an event processor with default configuration */
export function createEventProcessor(
  config?: Partial<ProcessorConfig>
): EventProcessor {
  return new EventProcessor(config);
}

// ============================================================================
// Singleton
// ============================================================================

/** Default event processor instance */
export const eventProcessor = new EventProcessor({ autoProcess: false });
