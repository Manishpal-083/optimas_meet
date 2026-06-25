const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config();

const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes');
const { initSocketServer } = require('./src/sockets/socketHandler');
const { errorHandler, notFound } = require('./src/middleware/error.middleware');

// Initialize database hook
connectDB();

const app = express();
const server = http.createServer(app);

// CORS configuration for REST and WebSockets
const CORS_OPTIONS = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', // Vite default port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(CORS_OPTIONS));
app.use(express.json());

// Main REST API Gateway Routing
app.use('/api', apiRoutes);

// Root Hello Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Optimas Meet Core API Gateway',
    documentation: 'See project structure for available API and Socket.io endpoints.'
  });
});

// Configure Socket.io server
const io = socketio(server, {
  cors: CORS_OPTIONS,
  transports: ['websocket', 'polling']
});

// Initialize Socket Event Listeners
initSocketServer(io);

// Catch-all route and Global Error handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log("========================================");
  console.log(`Optimas Meet Core Server running!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Gateway URI: http://localhost:${PORT}`);
  console.log("========================================");
});
