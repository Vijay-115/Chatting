// context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socketInstance, setSocketInstance] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      const s = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      socketRef.current = s;
      setSocketInstance(s);

      s.on('connect', () => {
        console.log('✅ Socket connected');
      });

      return () => s.disconnect();
    }
  }, [token]);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};