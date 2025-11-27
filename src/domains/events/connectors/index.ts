/**
 * Event Connectors Module
 *
 * Re-exports all event connectors for external integrations.
 */

// SSE Connector
export {
  SSEConnector,
  createSSEConnector,
  type SSEConnectionState,
  type SSEConnectorConfig,
  type SSEEventData,
  type ConnectionCallback,
  type SSEEventCallback,
} from './sseConnector';

// Webhook Connector
export {
  WebhookConnector,
  createWebhookConnector,
  webhookConnector,
  type WebhookPayload,
  type WebhookResult,
  type WebhookConfig,
  type ValidationResult,
  type WebhookMetrics,
} from './webhookConnector';
