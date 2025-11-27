/**
 * Event Handlers Module
 *
 * Re-exports all event handlers for processing events.
 */

// Risk Handler
export {
  RiskHandler,
  createRiskHandler,
  riskHandler,
  type RiskLevel,
  type RiskCategory,
  type RiskChangePayload,
  type RiskAlertPayload,
  type RiskHandlerConfig,
  type RiskHandlerStats,
} from './riskHandler';

// Alert Handler
export {
  AlertHandler,
  createAlertHandler,
  alertHandler,
  type AlertSeverity,
  type AlertStatus,
  type AlertCategory,
  type Alert,
  type AlertHandlerConfig,
  type AlertHandlerStats,
} from './alertHandler';
