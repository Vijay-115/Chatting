const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');
const initSocket = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ CORS + Preflight support
app.use(cors({
  origin: 'https://chat-vd.xyz',
  credentials: true,
}));

// ✅ Middleware
app.use(cookieParser());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// ✅ MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', require('./routes/messages'));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/api', uploadRoutes);
app.use('/api', mediaRoutes);

// ✅ Health check
app.get('/', (req, res) => {
  res.send('✅ Chat backend is live!');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Start WebSocket
initSocket(server);
