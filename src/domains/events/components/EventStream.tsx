/**
 * EventStream Component
 *
 * Manages real-time event connections with:
 * - Automatic reconnection with exponential backoff
 * - Connection status tracking
 * - Error handling
 * - Mock SSE for development
 */

import { useEffect, useState, useCallback } from 'react';
import { eventBus, EventType, createEvent } from '../';
import { MockSSEService } from '../services/mockSSE';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseEventStreamOptions {
  /** Whether to use mock SSE (development mode) */
  useMock?: boolean;
  /** Mock event interval in milliseconds */
  mockInterval?: number;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff (ms) */
  baseReconnectDelay?: number;
}

/**
 * Hook for managing event stream connection
 */
export function useEventStream(options: UseEventStreamOptions = {}) {
  const {
    useMock = true, // Default to mock in development
    mockInterval = 10000,
    autoConnect = true,
    maxReconnectAttempts = 5,
    baseReconnectDelay = 1000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [mockService] = useState(() => new MockSSEService({
    enabled: useMock,
    eventInterval: mockInterval,
  }));

  /**
   * Handle incoming events
   */
  const handleEvent = useCallback((event: any) => {
    // Publish to event bus
    eventBus.publish(event);
  }, []);

  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempt >= maxReconnectAttempts) {
      console.error('[EventStream] Max reconnection attempts reached');
      setStatus('error');

      eventBus.publish(
        createEvent(EventType.CONNECTION_STATUS_CHANGED, {
          status: 'error',
          message: 'Max reconnection attempts reached',
        })
      );
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempt);
    console.log(`[EventStream] Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${maxReconnectAttempts})`);

    setTimeout(() => {
      setReconnectAttempt((prev) => prev + 1);
      setStatus('connecting');
    }, delay);
  }, [reconnectAttempt, maxReconnectAttempts, baseReconnectDelay]);

  /**
   * Connect to event stream
   */
  const connect = useCallback(() => {
    setStatus('connecting');

    if (useMock) {
      // Use mock SSE for development
      try {
        mockService.start(handleEvent);
        setStatus('connected');
        setReconnectAttempt(0);

        // Emit connection status event
        eventBus.publish(
          createEvent(EventType.CONNECTION_STATUS_CHANGED, {
            status: 'connected',
            message: 'Mock event stream connected',
          })
        );
      } catch (error) {
        console.error('[EventStream] Mock connection error:', error);
        setStatus('error');
        scheduleReconnect();
      }
    } else {
      // Real SSE would go here
      // For now, fall back to mock
      console.warn('[EventStream] Real SSE not implemented, using mock');
      mockService.start(handleEvent);
      setStatus('connected');
    }
  }, [useMock, mockService, handleEvent, scheduleReconnect]);

  /**
   * Disconnect from event stream
   */
  const disconnect = useCallback(() => {
    mockService.stop();
    setStatus('disconnected');

    eventBus.publish(
      createEvent(EventType.CONNECTION_STATUS_CHANGED, {
        status: 'disconnected',
      })
    );
  }, [mockService]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setReconnectAttempt(0);
      connect();
    },
  };
}

/**
 * Connection Status Indicator Component
 */
interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  onClick?: () => void;
}

export function ConnectionStatusIndicator({ status, onClick }: ConnectionStatusIndicatorProps) {
  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      icon: '●',
    },
    connecting: {
      color: 'bg-yellow-500 animate-pulse',
      text: 'Connecting...',
      icon: '◐',
    },
    disconnected: {
      color: 'bg-gray-500',
      text: 'Disconnected',
      icon: '○',
    },
    error: {
      color: 'bg-red-500',
      text: 'Error',
      icon: '✕',
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1 text-xs rounded-full bg-component-dark border border-border-dark hover:bg-component-dark/80 transition-colors"
      title={`Event stream status: ${config.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
      <span className="text-gray-300 hidden sm:inline">{config.text}</span>
    </button>
  );
}
