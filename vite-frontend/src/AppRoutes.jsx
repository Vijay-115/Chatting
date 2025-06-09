// AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import ChatList from './components/ChatList';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import { useSocket } from './context/SocketContext';

function AppRoutes() {
const socket = useSocket(); 
  return (
    <Routes>
    <Route
        path="/"
        element={
        <PublicRoute>
            <Login />
        </PublicRoute>
        }
    />
    <Route
        path="/register"
        element={
        <PublicRoute>
            <Register />
        </PublicRoute>
        }
    />
    <Route
        path="/dashboard"
        element={
        <PrivateRoute>
            <Dashboard />
        </PrivateRoute>
        }
    />
    <Route path="/chat/:id" element={<Chat />} />
    <Route
        path="/chats"
        element={
        <PrivateRoute>
            <ChatList />
        </PrivateRoute>
        }
    />
    </Routes>
  );
}

export default AppRoutes;