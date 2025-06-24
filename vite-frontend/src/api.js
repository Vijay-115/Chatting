import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'https://backend.chat-vd.xyz',
  withCredentials: true,
});

// ===== Auth =====
export const registerUser = (userData) => API.post('/api/auth/register', userData);
export const loginUser = (credentials) => API.post('/api/auth/login', credentials);
export const logoutUser = () => API.post('/api/auth/logout');

// ===== Users =====
export const getFriends = () => API.get('/api/users/friends');
export const sendRequest = (userData) => API.post('/api/users/send-request', userData);
export const getFriendRequests = () => API.get('/api/users/friend-requests');
export const acceptRequest = (senderId) => API.post('/api/users/accept-request', { senderId });
export const getUserById = (id) => API.get(`/api/users/user-by-id?id=${id}`);
export const searchUsers = (query) => API.get(`/api/users/search?query=${query}`);

// ===== Messages =====
export const getLatestMessages = () => API.get('/api/messages/latest');
export const getMessages = (conversationId) => API.get(`/api/messages/${conversationId}`);
export const sendMessage = (messageData) => API.post('/api/messages/send', messageData);
export const markMessagesRead = (fromUserId) =>  API.post('/api/messages/read', fromUserId );

// ===== File Upload =====
export const uploadFile = (uploadData) =>  API.post('/api/upload', uploadData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
});
export const verifyMedia = (verifyData) =>  API.post('/api/verify-media', verifyData );
