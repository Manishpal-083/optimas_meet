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

// CORS configuration for REST and WebSockets supporting multiple dynamic origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://optimas-meet.vercel.app',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

const CORS_OPTIONS = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    try {
      const parsedUrl = new URL(origin);
      const hostname = parsedUrl.hostname;
      
      // Allow any Vercel subdomains (including preview deployments) and local developments
      if (
        hostname.endsWith('.vercel.app') || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1'
      ) {
        return callback(null, true);
      }
    } catch (err) {
      // Invalid URL syntax in origin header
    }

    callback(new Error('Not allowed by CORS'));
  },
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
