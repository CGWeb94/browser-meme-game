import { useRef, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

type MessageHandler = (event: string, data: any) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const pingTimer = useRef<ReturnType<typeof setInterval>>();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Client-side heartbeat
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'ping', data: {} }));
        }
      }, 25000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        onMessageRef.current(msg.event, msg.data);
      } catch {
        console.error('Invalid message', ev.data);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      clearInterval(pingTimer.current);
      // Auto-reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  const send = useCallback((event: string, data: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket not connected, cannot send', event);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    clearInterval(pingTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
    };
  }, []);

  return { connect, send, disconnect };
}
