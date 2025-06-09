const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const fs = require('fs');
const path = require('path');

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  // Middleware for token auth
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User connected: ${userId}`);

    // Emit current online users to newly connected socket
    socket.emit('onlineUsers', [...onlineUsers.keys()]);

    // ✅ Add this
    socket.on("getOnlineUsers", () => {
      console.log(`📨 ${userId} requested online users`);
      socket.emit("onlineUsers", [...onlineUsers.keys()]);
    });

    socket.broadcast.emit('userOnline', userId);

    // Send message
    socket.on('sendMessage', async (msg) => {
      try {
        if (!msg.text && !msg.media) {
          return socket.emit('errorMessage', 'Message must contain either text or media.');
        }

        const newMsg = new Message(msg);
        await newMsg.save();

        // If media is present, inject timestamp into base64 file
        if (msg.media) {
          const mediaPath = path.join(__dirname, 'media', path.basename(msg.media));

          if (fs.existsSync(mediaPath)) {
            const base64Content = fs.readFileSync(mediaPath, 'utf8');
            const timestamp = new Date(newMsg.createdAt).getTime().toString();
            const insertAt = Math.floor(Math.random() * base64Content.length);
            const newContent = base64Content.slice(0, insertAt) + timestamp + base64Content.slice(insertAt);
            fs.writeFileSync(mediaPath, newContent, 'utf8');
            console.log(`✅ Timestamp appended to base64 in: ${mediaPath}`);
          } else {
            console.warn('⚠️ Media file not found:', mediaPath);
          }
        }

        // Emit to receiver and also to sender to update their chat list
        io.to(msg.to).emit('receiveMessage', newMsg);
        io.to(msg.from).emit('newMessage', newMsg); // for sender
        io.to(msg.to).emit('newMessage', newMsg);   // for receiver

      } catch (err) {
        console.error('❌ Error saving message:', err);
        socket.emit('errorMessage', 'Failed to send message.');
      }
    });

    // Typing indicators
    socket.on('typing', ({ to }) => {
      io.to(to).emit('typing', { from: userId });
    });

    socket.on('stopTyping', ({ to }) => {
      io.to(to).emit('stopTyping', { from: userId });
    });

    // Message read logic
    socket.on('messageRead', ({ to }) => {
      console.log(`📖 ${userId} read messages from ${to}`);
      
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('messageRead', { from: userId });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('onlineUsers', [...onlineUsers.keys()]);
      socket.broadcast.emit('userOffline', userId); // ✅
      console.log(`❌ User ${userId} disconnected`);
    });
  });
};

module.exports = initSocket;