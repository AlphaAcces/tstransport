/**
 * Risk Handler
 *
 * Handles risk-related events, updates risk scores,
 * and triggers appropriate responses.
 */

import { EventType } from '../types';
import { eventBus } from '../eventBus';
import type { ProcessableEvent, HandlerRegistration } from '../core/eventProcessor';

// ============================================================================
// Types
// ============================================================================

/** Risk levels */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Risk category */
export type RiskCategory =
  | 'financial'
  | 'regulatory'
  | 'operational'
  | 'reputational'
  | 'legal'
  | 'compliance';

/** Risk change payload */
export interface RiskChangePayload {
  category: RiskCategory;
  previousLevel: RiskLevel;
  currentLevel: RiskLevel;
  score?: number;
  reason?: string;
  factors?: string[];
  entityId?: string;
  entityType?: 'person' | 'company';
}

/** Risk alert payload */
export interface RiskAlertPayload {
  alertId: string;
  category: RiskCategory;
  level: RiskLevel;
  title: string;
  description: string;
  entityId?: string;
  entityType?: 'person' | 'company';
  timestamp: string;
  recommended_actions?: string[];
}

/** Risk handler configuration */
export interface RiskHandlerConfig {
  /** Threshold for escalation (0-100) */
  escalationThreshold: number;
  /** Auto-create alerts for high/critical changes */
  autoCreateAlerts: boolean;
  /** Notification callback */
  onRiskEscalation?: (payload: RiskChangePayload) => void;
  /** Alert callback */
  onAlertCreated?: (payload: RiskAlertPayload) => void;
}

/** Risk handler statistics */
export interface RiskHandlerStats {
  eventsHandled: number;
  riskChanges: number;
  alertsCreated: number;
  escalations: number;
  byCategory: Record<RiskCategory, number>;
  byLevel: Record<RiskLevel, number>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: RiskHandlerConfig = {
  escalationThreshold: 75,
  autoCreateAlerts: true,
};

// ============================================================================
// Risk Handler
// ============================================================================

export class RiskHandler {
  private config: RiskHandlerConfig;
  private stats: RiskHandlerStats = {
    eventsHandled: 0,
    riskChanges: 0,
    alertsCreated: 0,
    escalations: 0,
    byCategory: {} as Record<RiskCategory, number>,
    byLevel: {} as Record<RiskLevel, number>,
  };

  constructor(config: Partial<RiskHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Event Handling
  // --------------------------------------------------------------------------

  /**
   * Handle a risk-related event
   */
  async handleEvent(event: ProcessableEvent): Promise<void> {
    this.stats.eventsHandled++;

    switch (event.type) {
      case EventType.RISK_CHANGED:
        await this.handleRiskChange(event);
        break;

      case EventType.RISK_ALERT_CREATED:
        await this.handleRiskAlert(event);
        break;

      default:
        // Check if event payload contains risk information
        if (this.hasRiskPayload(event)) {
          await this.processRiskPayload(event);
        }
    }
  }

  /**
   * Handle risk change event
   */
  private async handleRiskChange(event: ProcessableEvent): Promise<void> {
    const payload = event.payload as RiskChangePayload;

    this.stats.riskChanges++;
    this.trackCategory(payload.category);
    this.trackLevel(payload.currentLevel);

    // Check for escalation
    if (this.shouldEscalate(payload)) {
      await this.escalateRisk(payload);
    }

    // Auto-create alert if configured
    if (this.config.autoCreateAlerts && this.isSignificantChange(payload)) {
      await this.createRiskAlert(payload);
    }

    console.log('[RiskHandler] Risk change processed:', {
      category: payload.category,
      change: `${payload.previousLevel} → ${payload.currentLevel}`,
      entityId: payload.entityId,
    });
  }

  /**
   * Handle risk alert event
   */
  private async handleRiskAlert(event: ProcessableEvent): Promise<void> {
    const payload = event.payload as RiskAlertPayload;

    this.stats.alertsCreated++;
    this.trackCategory(payload.category);
    this.trackLevel(payload.level);

    // Notify callback if configured
    if (this.config.onAlertCreated) {
      this.config.onAlertCreated(payload);
    }

    console.log('[RiskHandler] Risk alert received:', {
      alertId: payload.alertId,
      category: payload.category,
      level: payload.level,
      title: payload.title,
    });
  }

  /**
   * Process generic event with risk payload
   */
  private async processRiskPayload(event: ProcessableEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const riskData = payload.risk as RiskChangePayload | undefined;

    if (riskData) {
      // Create a synthetic risk change event
      const syntheticEvent: ProcessableEvent = {
        id: `${event.id}-risk`,
        type: EventType.RISK_CHANGED,
        timestamp: event.timestamp,
        payload: riskData,
      };

      await this.handleRiskChange(syntheticEvent);
    }
  }

  // --------------------------------------------------------------------------
  // Risk Assessment
  // --------------------------------------------------------------------------

  /**
   * Check if risk should be escalated
   */
  private shouldEscalate(payload: RiskChangePayload): boolean {
    const levelScore = this.getLevelScore(payload.currentLevel);
    return levelScore >= this.config.escalationThreshold;
  }

  /**
   * Check if this is a significant risk change
   */
  private isSignificantChange(payload: RiskChangePayload): boolean {
    const previousScore = this.getLevelScore(payload.previousLevel);
    const currentScore = this.getLevelScore(payload.currentLevel);

    // Significant if:
    // - Level increased by more than one step
    // - Moved to high or critical
    // - Score increased by more than 25 points
    return (
      currentScore - previousScore >= 25 ||
      (payload.currentLevel === 'high' && payload.previousLevel !== 'high') ||
      payload.currentLevel === 'critical'
    );
  }

  /**
   * Get numeric score for risk level
   */
  private getLevelScore(level: RiskLevel): number {
    const scores: Record<RiskLevel, number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    };
    return scores[level];
  }

  /**
   * Check if event payload contains risk information
   */
  private hasRiskPayload(event: ProcessableEvent): boolean {
    const payload = event.payload as Record<string, unknown>;
    return (
      payload &&
      typeof payload === 'object' &&
      ('risk' in payload || 'riskLevel' in payload || 'riskScore' in payload)
    );
  }

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  /**
   * Escalate a risk
   */
  private async escalateRisk(payload: RiskChangePayload): Promise<void> {
    this.stats.escalations++;

    // Notify callback if configured
    if (this.config.onRiskEscalation) {
      this.config.onRiskEscalation(payload);
    }

    console.log('[RiskHandler] Risk escalated:', {
      category: payload.category,
      level: payload.currentLevel,
      reason: payload.reason,
    });
  }

  /**
   * Create a risk alert from a risk change
   */
  private async createRiskAlert(change: RiskChangePayload): Promise<void> {
    const alert: RiskAlertPayload = {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: change.category,
      level: change.currentLevel,
      title: `Risk Level Changed to ${change.currentLevel.toUpperCase()}`,
      description: change.reason ?? `Risk level in ${change.category} has changed from ${change.previousLevel} to ${change.currentLevel}`,
      entityId: change.entityId,
      entityType: change.entityType,
      timestamp: new Date().toISOString(),
      recommended_actions: this.getRecommendedActions(change),
    };

    // Publish alert event
    eventBus.publish({
      type: EventType.RISK_ALERT_CREATED,
      timestamp: new Date(),
      payload: alert,
    });

    console.log('[RiskHandler] Alert created:', alert.alertId);
  }

  /**
   * Get recommended actions based on risk change
   */
  private getRecommendedActions(change: RiskChangePayload): string[] {
    const actions: string[] = [];

    if (change.currentLevel === 'critical') {
      actions.push('Immediate review required');
      actions.push('Escalate to senior management');
      actions.push('Document all findings');
    } else if (change.currentLevel === 'high') {
      actions.push('Schedule review within 24 hours');
      actions.push('Notify relevant stakeholders');
    }

    // Category-specific actions
    switch (change.category) {
      case 'financial':
        actions.push('Review recent transactions');
        actions.push('Check for anomalies in financial data');
        break;
      case 'regulatory':
        actions.push('Verify compliance status');
        actions.push('Review regulatory filings');
        break;
      case 'operational':
        actions.push('Assess operational impact');
        break;
      case 'reputational':
        actions.push('Monitor public mentions');
        actions.push('Prepare communication strategy');
        break;
      case 'legal':
        actions.push('Consult legal team');
        break;
      case 'compliance':
        actions.push('Review compliance checklist');
        break;
    }

    return actions;
  }

  // --------------------------------------------------------------------------
  // Metrics
  // --------------------------------------------------------------------------

  private trackCategory(category: RiskCategory): void {
    this.stats.byCategory[category] = (this.stats.byCategory[category] ?? 0) + 1;
  }

  private trackLevel(level: RiskLevel): void {
    this.stats.byLevel[level] = (this.stats.byLevel[level] ?? 0) + 1;
  }

  /**
   * Get handler statistics
   */
  getStats(): RiskHandlerStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      eventsHandled: 0,
      riskChanges: 0,
      alertsCreated: 0,
      escalations: 0,
      byCategory: {} as Record<RiskCategory, number>,
      byLevel: {} as Record<RiskLevel, number>,
    };
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  /**
   * Get handler registration for event processor
   */
  getRegistration(id = 'risk-handler'): HandlerRegistration {
    return {
      id,
      eventTypes: [EventType.RISK_CHANGED, EventType.RISK_ALERT_CREATED],
      handler: (event) => this.handleEvent(event),
      priority: 10, // High priority for risk events
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RiskHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create a risk handler */
export function createRiskHandler(
  config?: Partial<RiskHandlerConfig>
): RiskHandler {
  return new RiskHandler(config);
}

// ============================================================================
// Singleton
// ============================================================================

/** Default risk handler instance */
export const riskHandler = new RiskHandler();
