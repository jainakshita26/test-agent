// src/context/WebSocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectCount(0);
        wsRef.current = ws;
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle ping messages automatically
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect with exponential backoff
        const timeout = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
        console.log(`Reconnecting in ${timeout / 1000} seconds...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectCount(prev => prev + 1);
          connect();
        }, timeout);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };
  
  const disconnect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };
  
  const send = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  const subscribe = (channel, parameters = {}) => {
    return send({
      type: 'subscribe',
      channel,
      parameters,
      timestamp: new Date()
    });
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, []);
  
  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};