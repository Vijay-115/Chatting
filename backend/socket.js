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
    io.emit('onlineUsers', [...onlineUsers.keys()]);

    // Send message
    socket.on('sendMessage', async (msg) => {
      try {
        if (!msg.text && !msg.media) {
          return socket.emit('errorMessage', 'Message must contain either text or media.');
        }

        const newMsg = new Message(msg);
        await newMsg.save();

        if (msg.media) {
          // Full media file path
          const mediaPath = path.join(__dirname, 'media', path.basename(msg.media));

          if (fs.existsSync(mediaPath)) {
            const base64Content = fs.readFileSync(mediaPath, 'utf8');

            // Convert createdAt to timestamp in milliseconds
            const timestamp = new Date(newMsg.createdAt).getTime().toString();
            const insertAt = Math.floor(Math.random() * base64Content.length);
            const newContent = base64Content.slice(0, insertAt) + timestamp + base64Content.slice(insertAt);

            // Overwrite the file with new content
            fs.writeFileSync(mediaPath, newContent, 'utf8');

            console.log(`✅ Timestamp appended directly to base64 string in: ${mediaPath}`);
          } else {
            console.warn('⚠️ Media file not found:', mediaPath);
          }
        }

        io.to(msg.to).emit('receiveMessage', newMsg);
      } catch (err) {
        console.error('Error saving message:', err);
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

    // Message read
    socket.on('messageRead', ({ to }) => {
      io.to(to).emit('messageRead', { from: userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('onlineUsers', [...onlineUsers.keys()]);
      console.log(`User ${userId} disconnected`);
    });
  });
};

module.exports = initSocket;