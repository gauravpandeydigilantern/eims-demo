import { useEffect, useRef } from "react";

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Allow overriding the WebSocket URL via Vite env (VITE_WS_URL)
      // Useful when the API server lives on a different origin or port.
      const envWsUrl = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;

      // Build a safe host: prefer window.location.host, but avoid including an `:undefined` port
      const hostname = window.location.hostname || 'localhost';
      const port = window.location.port && window.location.port !== '0' ? window.location.port : '';

      let wsUrl: string;
      if (envWsUrl) {
        wsUrl = envWsUrl;
      } else if (hostname) {
        // If no port is present, default to 5000 (the server's default)
        wsUrl = port
          ? `${protocol}//${hostname}:${port}/ws`
          : `${protocol}//${hostname}:5000/ws`;
      } else {
        wsUrl = `${protocol}//localhost:5000/ws`;
      }
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        socketRef.current = socket;
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        socketRef.current = null;
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, delay);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
}
