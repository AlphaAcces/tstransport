/**
 * Webhook Connector
 *
 * Handles incoming webhooks and transforms them into
 * application events for processing.
 */

import { EventType, type BaseEvent } from '../types';
import { eventBus } from '../eventBus';
import { eventProcessor } from '../core/eventProcessor';
import { EventPriority } from '../core/eventQueue';

// ============================================================================
// Types
// ============================================================================

/** Webhook payload structure */
export interface WebhookPayload {
  id?: string;
  type: string;
  timestamp?: string;
  data: unknown;
  source?: string;
  signature?: string;
}

/** Webhook handler result */
export interface WebhookResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/** Webhook configuration */
export interface WebhookConfig {
  /** Validate webhook signatures */
  validateSignature: boolean;
  /** Secret for signature validation */
  secret?: string;
  /** Map of source -> event type mappings */
  sourceMapping?: Record<string, EventType>;
  /** Priority for incoming webhooks */
  defaultPriority: EventPriority;
  /** Transform function for payloads */
  payloadTransformer?: (payload: WebhookPayload) => WebhookPayload;
}

/** Webhook validation result */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Webhook metrics */
export interface WebhookMetrics {
  received: number;
  processed: number;
  failed: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  lastReceivedAt: Date | null;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: WebhookConfig = {
  validateSignature: false,
  defaultPriority: EventPriority.NORMAL,
};

// ============================================================================
// Webhook Connector
// ============================================================================

export class WebhookConnector {
  private config: WebhookConfig;
  private metrics: WebhookMetrics = {
    received: 0,
    processed: 0,
    failed: 0,
    bySource: {},
    byType: {},
    lastReceivedAt: null,
  };

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Webhook Processing
  // --------------------------------------------------------------------------

  /**
   * Process an incoming webhook
   */
  async processWebhook(
    payload: WebhookPayload,
    signature?: string
  ): Promise<WebhookResult> {
    this.metrics.received++;
    this.metrics.lastReceivedAt = new Date();

    try {
      // Validate signature if configured
      if (this.config.validateSignature) {
        const validation = this.validateSignature(payload, signature);
        if (!validation.valid) {
          this.metrics.failed++;
          return {
            success: false,
            error: validation.error ?? 'Invalid signature',
          };
        }
      }

      // Transform payload if transformer is provided
      const transformedPayload = this.config.payloadTransformer
        ? this.config.payloadTransformer(payload)
        : payload;

      // Map to app event
      const appEvent = this.mapToAppEvent(transformedPayload);
      if (!appEvent) {
        this.metrics.failed++;
        return {
          success: false,
          error: `Unknown webhook type: ${transformedPayload.type}`,
        };
      }

      // Track metrics
      this.trackMetrics(transformedPayload);

      // Determine priority
      const priority = this.determinePriority(transformedPayload);

      // Submit to event processor
      const eventId = eventProcessor.submit(appEvent, priority);

      // Also publish directly to event bus for immediate subscribers
      eventBus.publish(appEvent);

      this.metrics.processed++;

      return {
        success: true,
        eventId,
      };
    } catch (error) {
      this.metrics.failed++;
      const message = error instanceof Error ? error.message : 'Processing failed';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Process a batch of webhooks
   */
  async processBatch(
    webhooks: Array<{ payload: WebhookPayload; signature?: string }>
  ): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    for (const { payload, signature } of webhooks) {
      const result = await this.processWebhook(payload, signature);
      results.push(result);
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  private validateSignature(
    payload: WebhookPayload,
    signature?: string
  ): ValidationResult {
    if (!this.config.secret) {
      return {
        valid: false,
        error: 'No secret configured for signature validation',
      };
    }

    if (!signature) {
      return {
        valid: false,
        error: 'No signature provided',
      };
    }

    // Simple HMAC-like validation (in production, use crypto.subtle.verify)
    // This is a placeholder - real implementation would use proper HMAC
    const expectedSignature = this.computeSignature(payload);
    const isValid = signature === expectedSignature;

    return {
      valid: isValid,
      error: isValid ? undefined : 'Signature mismatch',
    };
  }

  private computeSignature(payload: WebhookPayload): string {
    // Placeholder signature computation
    // In production, use crypto.subtle with HMAC-SHA256
    const data = JSON.stringify(payload);
    const secret = this.config.secret ?? '';

    // Simple hash for demonstration
    let hash = 0;
    const combined = data + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return `sha256=${Math.abs(hash).toString(16)}`;
  }

  // --------------------------------------------------------------------------
  // Event Mapping
  // --------------------------------------------------------------------------

  private mapToAppEvent(payload: WebhookPayload): BaseEvent | null {
    const eventType = this.resolveEventType(payload);
    if (!eventType) {
      return null;
    }

    return {
      type: eventType,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      payload: payload.data,
    };
  }

  private resolveEventType(payload: WebhookPayload): EventType | null {
    // Check source mapping first
    if (payload.source && this.config.sourceMapping) {
      const mapped = this.config.sourceMapping[payload.source];
      if (mapped) {
        return mapped;
      }
    }

    // Try direct type match
    const directMatch = Object.values(EventType).find(
      (et) =>
        et === payload.type ||
        et.toLowerCase() === payload.type.toLowerCase()
    );
    if (directMatch) {
      return directMatch;
    }

    // Common webhook type mappings
    const typeMap: Record<string, EventType> = {
      // Person events
      'person.updated': EventType.PERSON_UPDATED,
      'person.network.changed': EventType.PERSON_NETWORK_CHANGED,

      // Company events
      'company.updated': EventType.COMPANY_UPDATED,
      'company.ownership.changed': EventType.COMPANY_OWNERSHIP_CHANGED,

      // Timeline events
      'timeline.added': EventType.TIMELINE_ADDED,
      'timeline.updated': EventType.TIMELINE_UPDATED,
      'timeline.deleted': EventType.TIMELINE_DELETED,

      // Risk events
      'risk.changed': EventType.RISK_CHANGED,
      'risk.alert': EventType.RISK_ALERT_CREATED,
      'risk.alert.created': EventType.RISK_ALERT_CREATED,

      // Financial events
      'financial.updated': EventType.FINANCIAL_UPDATED,
      'cashflow.updated': EventType.CASHFLOW_UPDATED,

      // Hypothesis events
      'hypothesis.created': EventType.HYPOTHESIS_CREATED,
      'hypothesis.updated': EventType.HYPOTHESIS_UPDATED,
      'hypothesis.verified': EventType.HYPOTHESIS_VERIFIED,

      // Action events
      'action.created': EventType.ACTION_CREATED,
      'action.completed': EventType.ACTION_COMPLETED,
      'action.assigned': EventType.ACTION_ASSIGNED,

      // System events
      'system.refresh': EventType.DATA_REFRESH,
      'data.refresh': EventType.DATA_REFRESH,
    };

    return typeMap[payload.type.toLowerCase()] ?? null;
  }

  private determinePriority(payload: WebhookPayload): EventPriority {
    // Check for priority hints in payload
    const data = payload.data as Record<string, unknown> | undefined;

    if (data?.priority === 'critical' || data?.urgent === true) {
      return EventPriority.CRITICAL;
    }

    if (data?.priority === 'high') {
      return EventPriority.HIGH;
    }

    if (data?.priority === 'low') {
      return EventPriority.LOW;
    }

    // Risk alerts are high priority
    if (payload.type.includes('risk') || payload.type.includes('alert')) {
      return EventPriority.HIGH;
    }

    return this.config.defaultPriority;
  }

  // --------------------------------------------------------------------------
  // Metrics
  // --------------------------------------------------------------------------

  private trackMetrics(payload: WebhookPayload): void {
    // Track by source
    if (payload.source) {
      this.metrics.bySource[payload.source] =
        (this.metrics.bySource[payload.source] ?? 0) + 1;
    }

    // Track by type
    this.metrics.byType[payload.type] =
      (this.metrics.byType[payload.type] ?? 0) + 1;
  }

  /**
   * Get webhook metrics
   */
  getMetrics(): WebhookMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      received: 0,
      processed: 0,
      failed: 0,
      bySource: {},
      byType: {},
      lastReceivedAt: null,
    };
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WebhookConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add source mapping
   */
  addSourceMapping(source: string, eventType: EventType): void {
    if (!this.config.sourceMapping) {
      this.config.sourceMapping = {};
    }
    this.config.sourceMapping[source] = eventType;
  }

  /**
   * Remove source mapping
   */
  removeSourceMapping(source: string): boolean {
    if (this.config.sourceMapping) {
      const existed = source in this.config.sourceMapping;
      delete this.config.sourceMapping[source];
      return existed;
    }
    return false;
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create a webhook connector */
export function createWebhookConnector(
  config?: Partial<WebhookConfig>
): WebhookConnector {
  return new WebhookConnector(config);
}

// ============================================================================
// Singleton
// ============================================================================

/** Default webhook connector instance */
export const webhookConnector = new WebhookConnector();
