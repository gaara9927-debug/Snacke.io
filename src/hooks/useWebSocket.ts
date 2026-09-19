import { useEffect, useRef, useState, useCallback } from 'react';
import { GiftEventPayload, LiveInfo } from '../types';

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatusText: string;
  lastGiftReceived: GiftEventPayload | null;
  serverLiveInfo: LiveInfo | null;
  reconnectNow: () => void;
}

export function useWebSocket(onEventReceived?: (type: string, data: any) => void): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatusText, setConnectionStatusText] = useState('Conectando');
  const [lastGiftReceived, setLastGiftReceived] = useState<GiftEventPayload | null>(null);
  const [serverLiveInfo, setServerLiveInfo] = useState<LiveInfo | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  const pingIntervalRef = useRef<number | null>(null);
  const onEventReceivedRef = useRef(onEventReceived);

  useEffect(() => {
    onEventReceivedRef.current = onEventReceived;
  }, [onEventReceived]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    // Clean any prior instance
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        return;
      }
      try {
        wsRef.current.close();
      } catch {
        // Handled
      }
      wsRef.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      setConnectionStatusText('Conectando');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setConnectionStatusText('Sincronizado');

        // Setup client heartbeat ping every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch {
              // Handled
            }
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'pong') {
            return;
          }

          if (type === 'live_status') {
            setServerLiveInfo(data);
          } else if (type === 'gift_received') {
            setLastGiftReceived(data);
          } else if (type === 'connection_status') {
            setIsConnected(Boolean(data?.connected));
            setConnectionStatusText(data?.connected ? 'Sincronizado' : 'Aguardando');
          }

          if (onEventReceivedRef.current) {
            onEventReceivedRef.current(type, data);
          }
        } catch {
          // Ignore invalid or non-JSON payloads
        }
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);
        setConnectionStatusText('Desconectado');

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Clean auto-reconnect with safety interval
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (!isUnmountedRef.current) {
            connect();
          }
        }, 3500);
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);
        setConnectionStatusText('Erro');
      };
    } catch {
      setIsConnected(false);
      setConnectionStatusText('Erro');
    }
  }, []);

  const reconnectNow = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Handled
      }
      wsRef.current = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // Handled
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    connectionStatusText,
    lastGiftReceived,
    serverLiveInfo,
    reconnectNow,
  };
}
