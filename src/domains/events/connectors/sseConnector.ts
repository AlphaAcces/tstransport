/**
 * SSE Connector
 *
 * Provides integration with Server-Sent Events for real-time
 * event streaming from external sources.
 */

import { EventType, type BaseEvent } from '../types';
import { eventBus } from '../eventBus';

// ============================================================================
// Types
// ============================================================================

/** SSE connection states */
export type SSEConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/** SSE connector configuration */
export interface SSEConnectorConfig {
  /** SSE endpoint URL */
  url: string;
  /** Reconnection delay in ms */
  reconnectDelay: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts: number;
  /** Event types to listen for (empty = all) */
  eventTypes?: string[];
  /** Custom headers for connection */
  headers?: Record<string, string>;
  /** Credentials mode */
  withCredentials?: boolean;
}

/** SSE event data */
export interface SSEEventData {
  type: string;
  payload: unknown;
  timestamp?: string;
  id?: string;
}

/** Connection event callback */
export type ConnectionCallback = (state: SSEConnectionState, error?: Error) => void;

/** Event callback */
export type SSEEventCallback = (event: SSEEventData) => void;

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Partial<SSEConnectorConfig> = {
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
  withCredentials: false,
};

// ============================================================================
// SSE Connector
// ============================================================================

export class SSEConnector {
  private config: SSEConnectorConfig;
  private eventSource: EventSource | null = null;
  private state: SSEConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private eventCallbacks: Set<SSEEventCallback> = new Set();

  constructor(config: SSEConnectorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as SSEConnectorConfig;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  /** Connect to the SSE endpoint */
  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');
    this.createEventSource();
  }

  /** Disconnect from the SSE endpoint */
  disconnect(): void {
    this.clearReconnectTimer();
    this.closeEventSource();
    this.reconnectAttempts = 0;
    this.setState('disconnected');
  }

  /** Reconnect to the SSE endpoint */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /** Get current connection state */
  getState(): SSEConnectionState {
    return this.state;
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  // --------------------------------------------------------------------------
  // Event Source Management
  // --------------------------------------------------------------------------

  private createEventSource(): void {
    try {
      // Create EventSource with configuration
      const options: EventSourceInit = {
        withCredentials: this.config.withCredentials,
      };

      this.eventSource = new EventSource(this.config.url, options);

      // Set up event handlers
      this.eventSource.onopen = this.handleOpen.bind(this);
      this.eventSource.onerror = this.handleError.bind(this);
      this.eventSource.onmessage = this.handleMessage.bind(this);

      // Listen for specific event types if configured
      if (this.config.eventTypes && this.config.eventTypes.length > 0) {
        for (const eventType of this.config.eventTypes) {
          this.eventSource.addEventListener(eventType, (event: MessageEvent) => {
            this.handleTypedMessage(eventType, event);
          });
        }
      }
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.setState('connected');

    // Publish connection event
    eventBus.publish({
      type: EventType.CONNECTION_STATUS_CHANGED,
      timestamp: new Date(),
      payload: {
        status: 'connected',
        source: 'sse',
        url: this.config.url,
      },
    });
  }

  private handleError(error: Event): void {
    console.error('[SSEConnector] Connection error:', error);

    // Check if EventSource is still open
    if (this.eventSource?.readyState === EventSource.CLOSED) {
      this.closeEventSource();
      this.attemptReconnect();
    } else {
      this.setState('error');
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = this.parseEventData(event);
      if (data) {
        this.processEvent(data);
      }
    } catch (error) {
      console.error('[SSEConnector] Failed to process message:', error);
    }
  }

  private handleTypedMessage(eventType: string, event: MessageEvent): void {
    try {
      const payload = JSON.parse(event.data);
      const data: SSEEventData = {
        type: eventType,
        payload,
        id: event.lastEventId,
        timestamp: new Date().toISOString(),
      };
      this.processEvent(data);
    } catch (error) {
      console.error(`[SSEConnector] Failed to process ${eventType} message:`, error);
    }
  }

  private handleConnectionError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Connection failed';
    console.error('[SSEConnector] Connection error:', message);

    this.setState('error');

    // Publish error event via normal publish
    eventBus.publish({
      type: EventType.CONNECTION_STATUS_CHANGED,
      timestamp: new Date(),
      payload: {
        status: 'error',
        source: 'sse',
        message: `SSE connection failed: ${message}`,
        url: this.config.url,
      },
    });

    this.attemptReconnect();
  }

  // --------------------------------------------------------------------------
  // Reconnection
  // --------------------------------------------------------------------------

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[SSEConnector] Max reconnection attempts reached');
      this.setState('error');

      eventBus.publish({
        type: EventType.CONNECTION_STATUS_CHANGED,
        timestamp: new Date(),
        payload: {
          status: 'error',
          source: 'sse',
          message: 'Max reconnection attempts reached',
        },
      });
      return;
    }

    this.reconnectAttempts++;
    this.setState('reconnecting');

    // Calculate delay with exponential backoff
    const delay = this.config.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(
      `[SSEConnector] Attempting reconnect ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // --------------------------------------------------------------------------
  // Event Processing
  // --------------------------------------------------------------------------

  private parseEventData(event: MessageEvent): SSEEventData | null {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(event.data);

      // Validate structure
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          type: parsed.type ?? 'unknown',
          payload: parsed.payload ?? parsed,
          id: event.lastEventId ?? parsed.id,
          timestamp: parsed.timestamp ?? new Date().toISOString(),
        };
      }

      return null;
    } catch {
      // If not JSON, wrap raw data
      return {
        type: 'raw',
        payload: event.data,
        id: event.lastEventId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private processEvent(data: SSEEventData): void {
    // Notify callbacks
    for (const callback of this.eventCallbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('[SSEConnector] Event callback error:', error);
      }
    }

    // Map to app event and publish to event bus
    const appEvent = this.mapToAppEvent(data);
    if (appEvent) {
      eventBus.publish(appEvent);
    }
  }

  private mapToAppEvent(data: SSEEventData): BaseEvent | null {
    // Map SSE event type to EventType enum
    const eventType = this.mapEventType(data.type);
    if (!eventType) {
      return null;
    }

    return {
      type: eventType,
      timestamp: new Date(data.timestamp ?? Date.now()),
      payload: data.payload,
    };
  }

  private mapEventType(sseType: string): EventType | null {
    // Try direct match
    const directMatch = Object.values(EventType).find(
      (et) => et === sseType || et.toLowerCase() === sseType.toLowerCase()
    );
    if (directMatch) {
      return directMatch;
    }

    // Try mapping common patterns
    const typeMap: Record<string, EventType> = {
      'person-updated': EventType.PERSON_UPDATED,
      'company-updated': EventType.COMPANY_UPDATED,
      'timeline-added': EventType.TIMELINE_ADDED,
      'risk-changed': EventType.RISK_CHANGED,
      'risk-alert': EventType.RISK_ALERT_CREATED,
      'financial-updated': EventType.FINANCIAL_UPDATED,
      'cashflow-updated': EventType.CASHFLOW_UPDATED,
      'action-created': EventType.ACTION_CREATED,
      'action-completed': EventType.ACTION_COMPLETED,
    };

    return typeMap[sseType.toLowerCase()] ?? null;
  }

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  private setState(newState: SSEConnectionState): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      for (const callback of this.connectionCallbacks) {
        try {
          callback(newState);
        } catch (error) {
          console.error('[SSEConnector] Connection callback error:', error);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  /** Subscribe to connection state changes */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /** Subscribe to events */
  onEvent(callback: SSEEventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  /** Dispose of the connector */
  dispose(): void {
    this.disconnect();
    this.connectionCallbacks.clear();
    this.eventCallbacks.clear();
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create an SSE connector */
export function createSSEConnector(config: SSEConnectorConfig): SSEConnector {
  return new SSEConnector(config);
}
