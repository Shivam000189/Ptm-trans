const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db');
const authUser = require('./src/routes/auth.routes');
const accountRoutes = require('./src/routes/account');
const notificationRoutes = require('./src/routes/notification');
require('dotenv').config();
const cors = require('cors');

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'paytm-dev-secret';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded._id;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

// Socket connection event
io.on('connection', (socket) => {
  const userId = socket.userId;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // Join a room named after user's MongoDB _id
  const userRoom = userId.toString();
  socket.join(userRoom);
  console.log(`Socket connected: ${socket.id} joined user room: ${userRoom}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Attach io instance to express app so routes can access it via req.app.get('io')
app.set('io', io);

app.use('/api/auth', authUser);
app.use('/api/account', accountRoutes);
app.use('/api/notifications', notificationRoutes);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { app, server, io };
