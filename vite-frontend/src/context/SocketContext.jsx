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
      const s = io('https://backend.chat-vd.xyz', {
        auth: { token },
        transports: ['polling'], // 🔥 Important: use only polling
        reconnectionAttempts: 5,
      });

      socketRef.current = s;
      setSocketInstance(s);

      s.on('connect', () => {
        console.log('✅ Socket connected');
      });

      s.on('connect_error', (err) => {
        console.error('❌ Socket error:', err.message);
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
