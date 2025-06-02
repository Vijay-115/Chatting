const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <-- add this
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const initSocket = require('./socket');
const cookieParser = require('cookie-parser');
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');

dotenv.config();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));

// app.use((req, res, next) => {
//   console.log("Request Origin:", req.headers.origin);
//   next();
// });

app.use(cookieParser());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', require('./routes/messages'));

// Serve media folder
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/api', uploadRoutes);
app.use('/api',mediaRoutes);

const PORT = process.env.PORT || 5000;

// Create HTTP server and then pass it to socket.io initializer
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize socket with the created server
initSocket(server);