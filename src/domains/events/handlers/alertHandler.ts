/**
 * Alert Handler
 *
 * Manages alert generation, delivery, and lifecycle
 * for various event types.
 */

import { EventType } from '../types';
import type { ProcessableEvent, HandlerRegistration } from '../core/eventProcessor';

// ============================================================================
// Types
// ============================================================================

/** Alert severity levels */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Alert status */
export type AlertStatus = 'new' | 'acknowledged' | 'resolved' | 'dismissed';

/** Alert category */
export type AlertCategory =
  | 'risk'
  | 'financial'
  | 'timeline'
  | 'action'
  | 'system'
  | 'security'
  | 'compliance';

/** Alert definition */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  status: AlertStatus;
  sourceEvent?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

/** Alert handler configuration */
export interface AlertHandlerConfig {
  /** Maximum alerts to keep in memory */
  maxAlerts: number;
  /** Auto-dismiss info alerts after ms (0 = never) */
  autoDismissInfo: number;
  /** Auto-dismiss warning alerts after ms (0 = never) */
  autoDismissWarning: number;
  /** Notification callback */
  onAlertCreated?: (alert: Alert) => void;
  /** Callback when alert is acknowledged */
  onAlertAcknowledged?: (alert: Alert) => void;
  /** Callback when alert is resolved */
  onAlertResolved?: (alert: Alert) => void;
}

/** Alert handler statistics */
export interface AlertHandlerStats {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  dismissedAlerts: number;
  bySeverity: Record<AlertSeverity, number>;
  byCategory: Record<AlertCategory, number>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: AlertHandlerConfig = {
  maxAlerts: 1000,
  autoDismissInfo: 0,
  autoDismissWarning: 0,
};

// ============================================================================
// Alert Handler
// ============================================================================

export class AlertHandler {
  private config: AlertHandlerConfig;
  private alerts: Map<string, Alert> = new Map();
  private autoDismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(config: Partial<AlertHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Event Handling
  // --------------------------------------------------------------------------

  /**
   * Handle an event and generate alerts if needed
   */
  async handleEvent(event: ProcessableEvent): Promise<void> {
    const alerts = this.generateAlerts(event);

    for (const alert of alerts) {
      await this.addAlert(alert);
    }
  }

  /**
   * Generate alerts from an event
   */
  private generateAlerts(event: ProcessableEvent): Alert[] {
    const alerts: Alert[] = [];

    switch (event.type) {
      case EventType.RISK_CHANGED:
        alerts.push(...this.generateRiskAlerts(event));
        break;

      case EventType.RISK_ALERT_CREATED:
        alerts.push(...this.generateRiskCreatedAlerts(event));
        break;

      case EventType.ACTION_CREATED:
      case EventType.ACTION_ASSIGNED:
        alerts.push(...this.generateActionAlerts(event));
        break;

      case EventType.FINANCIAL_UPDATED:
      case EventType.CASHFLOW_UPDATED:
        alerts.push(...this.generateFinancialAlerts(event));
        break;

      case EventType.TIMELINE_ADDED:
        alerts.push(...this.generateTimelineAlerts(event));
        break;

      case EventType.CONNECTION_STATUS_CHANGED:
        alerts.push(...this.generateSystemAlerts(event));
        break;
    }

    return alerts;
  }

  // --------------------------------------------------------------------------
  // Alert Generation
  // --------------------------------------------------------------------------

  private generateRiskAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;
    const currentLevel = payload.newLevel ?? payload.currentLevel;

    if (currentLevel === 'high' || currentLevel === 'critical') {
      return [
        this.createAlert({
          severity: currentLevel === 'critical' ? 'critical' : 'warning',
          category: 'risk',
          title: `Risk Level: ${String(currentLevel).toUpperCase()}`,
          message: `Risk level changed to ${currentLevel}${
            payload.reason ? `: ${payload.reason}` : ''
          }`,
          sourceEvent: event.id,
          entityId: payload.entityId as string,
          entityType: payload.entityType as string,
          metadata: { category: payload.category },
        }),
      ];
    }

    return [];
  }

  private generateRiskCreatedAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;

    return [
      this.createAlert({
        severity: this.mapRiskLevel(payload.level as string),
        category: 'risk',
        title: (payload.title as string) ?? 'Risk Alert',
        message: (payload.description as string) ?? 'A risk alert was created',
        sourceEvent: event.id,
        entityId: payload.entityId as string,
        entityType: payload.entityType as string,
        metadata: {
          alertId: payload.alertId,
          category: payload.category,
        },
      }),
    ];
  }

  private generateActionAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;

    return [
      this.createAlert({
        severity: 'info',
        category: 'action',
        title:
          event.type === EventType.ACTION_CREATED
            ? 'New Action Created'
            : 'Action Assigned',
        message: (payload.title as string) ?? 'An action requires attention',
        sourceEvent: event.id,
        metadata: {
          actionId: payload.id,
          priority: payload.priority,
          dueDate: payload.dueDate,
        },
      }),
    ];
  }

  private generateFinancialAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;

    // Only alert on significant financial changes
    if (payload.significant === true || payload.anomaly === true) {
      return [
        this.createAlert({
          severity: payload.anomaly ? 'warning' : 'info',
          category: 'financial',
          title: 'Financial Update',
          message:
            (payload.description as string) ?? 'Significant financial change detected',
          sourceEvent: event.id,
          metadata: payload,
        }),
      ];
    }

    return [];
  }

  private generateTimelineAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;
    const eventData = (payload.event as Record<string, unknown>) ?? payload;

    // Only alert on high-impact timeline events
    if (eventData.impact === 'high' || eventData.critical === true) {
      return [
        this.createAlert({
          severity: 'warning',
          category: 'timeline',
          title: (eventData.title as string) ?? 'Timeline Event',
          message:
            (eventData.description as string) ??
            'A significant timeline event was recorded',
          sourceEvent: event.id,
          metadata: { category: eventData.category },
        }),
      ];
    }

    return [];
  }

  private generateSystemAlerts(event: ProcessableEvent): Alert[] {
    const payload = event.payload as Record<string, unknown>;

    if (payload.status === 'error' || payload.status === 'disconnected') {
      return [
        this.createAlert({
          severity: payload.status === 'error' ? 'error' : 'warning',
          category: 'system',
          title: 'System Status Change',
          message:
            (payload.message as string) ??
            `System status changed to ${payload.status}`,
          sourceEvent: event.id,
          metadata: { source: payload.source },
        }),
      ];
    }

    return [];
  }

  // --------------------------------------------------------------------------
  // Alert Management
  // --------------------------------------------------------------------------

  private createAlert(
    params: Omit<Alert, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Alert {
    const now = new Date();
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      ...params,
    };
  }

  private async addAlert(alert: Alert): Promise<void> {
    // Check capacity
    if (this.alerts.size >= this.config.maxAlerts) {
      this.pruneOldAlerts();
    }

    this.alerts.set(alert.id, alert);

    // Set up auto-dismiss if configured
    this.setupAutoDismiss(alert);

    // Notify callback
    if (this.config.onAlertCreated) {
      this.config.onAlertCreated(alert);
    }

    console.log('[AlertHandler] Alert created:', {
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
    });
  }

  private setupAutoDismiss(alert: Alert): void {
    let delay = 0;

    if (alert.severity === 'info' && this.config.autoDismissInfo > 0) {
      delay = this.config.autoDismissInfo;
    } else if (alert.severity === 'warning' && this.config.autoDismissWarning > 0) {
      delay = this.config.autoDismissWarning;
    }

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.dismissAlert(alert.id);
      }, delay);
      this.autoDismissTimers.set(alert.id, timer);
    }
  }

  private pruneOldAlerts(): void {
    // Remove oldest resolved/dismissed alerts
    const sortedAlerts = Array.from(this.alerts.values())
      .filter((a) => a.status === 'resolved' || a.status === 'dismissed')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const toRemove = sortedAlerts.slice(0, Math.floor(this.config.maxAlerts * 0.1));

    for (const alert of toRemove) {
      this.alerts.delete(alert.id);
    }
  }

  private mapRiskLevel(level: string): AlertSeverity {
    const mapping: Record<string, AlertSeverity> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'critical',
    };
    return mapping[level?.toLowerCase()] ?? 'warning';
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Get an alert by ID
   */
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active (new or acknowledged) alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === 'new' || a.status === 'acknowledged'
    );
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => a.severity === severity);
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => a.category === category);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(id: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert || alert.status !== 'new') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.updatedAt = new Date();

    // Cancel auto-dismiss
    const timer = this.autoDismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoDismissTimers.delete(id);
    }

    if (this.config.onAlertAcknowledged) {
      this.config.onAlertAcknowledged(alert);
    }

    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(id: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert || alert.status === 'resolved' || alert.status === 'dismissed') {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.updatedAt = new Date();

    // Cancel auto-dismiss
    const timer = this.autoDismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoDismissTimers.delete(id);
    }

    if (this.config.onAlertResolved) {
      this.config.onAlertResolved(alert);
    }

    return true;
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert || alert.status === 'resolved' || alert.status === 'dismissed') {
      return false;
    }

    alert.status = 'dismissed';
    alert.updatedAt = new Date();

    // Cancel auto-dismiss
    const timer = this.autoDismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoDismissTimers.delete(id);
    }

    return true;
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    // Cancel all auto-dismiss timers
    for (const timer of this.autoDismissTimers.values()) {
      clearTimeout(timer);
    }
    this.autoDismissTimers.clear();
    this.alerts.clear();
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  /**
   * Get handler statistics
   */
  getStats(): AlertHandlerStats {
    const alerts = Array.from(this.alerts.values());

    const stats: AlertHandlerStats = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a) => a.status === 'new' || a.status === 'acknowledged')
        .length,
      acknowledgedAlerts: alerts.filter((a) => a.status === 'acknowledged').length,
      resolvedAlerts: alerts.filter((a) => a.status === 'resolved').length,
      dismissedAlerts: alerts.filter((a) => a.status === 'dismissed').length,
      bySeverity: {} as Record<AlertSeverity, number>,
      byCategory: {} as Record<AlertCategory, number>,
    };

    for (const alert of alerts) {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] ?? 0) + 1;
      stats.byCategory[alert.category] = (stats.byCategory[alert.category] ?? 0) + 1;
    }

    return stats;
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  /**
   * Get handler registration for event processor
   */
  getRegistration(id = 'alert-handler'): HandlerRegistration {
    return {
      id,
      eventTypes: [
        EventType.RISK_CHANGED,
        EventType.RISK_ALERT_CREATED,
        EventType.ACTION_CREATED,
        EventType.ACTION_ASSIGNED,
        EventType.FINANCIAL_UPDATED,
        EventType.CASHFLOW_UPDATED,
        EventType.TIMELINE_ADDED,
        EventType.CONNECTION_STATUS_CHANGED,
      ],
      handler: (event) => this.handleEvent(event),
      priority: 20, // Run after risk handler
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create an alert handler */
export function createAlertHandler(
  config?: Partial<AlertHandlerConfig>
): AlertHandler {
  return new AlertHandler(config);
}

// ============================================================================
// Singleton
// ============================================================================

/** Default alert handler instance */
export const alertHandler = new AlertHandler();
