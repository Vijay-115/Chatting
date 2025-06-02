import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socketInstance, setSocketInstance] = useState(null);
  const socket = useRef(null);

  useEffect(() => {
    if (token) {
      const s = io('http://localhost:5000', {
        auth: { token },
      });

      socket.current = s;
      setSocketInstance(s);

      return () => {
        s.disconnect();
      };
    }
  }, [token]);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};