import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './AppRoutes'; // ✅ You moved all <Routes> into AppRoutes
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;