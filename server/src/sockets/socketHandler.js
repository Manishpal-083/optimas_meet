const { registerWebRTCHandlers, handleUserLeaving } = require('./webrtcHandler');
const { registerChatHandlers } = require('./chatHandler');

const initSocketServer = (io) => {
  console.log("Socket.io: Registering Gateway Namespaces and Event Hooks...");

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Register handlers for features
    registerWebRTCHandlers(io, socket);
    registerChatHandlers(io, socket);

    // Standard ping event to verify link health
    socket.on('ping-check', (cb) => {
      if (typeof cb === 'function') cb({ status: 'pong', timestamp: new Date() });
    });

    // Cleanup on client disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      handleUserLeaving(io, socket);
    });
  });
};

module.exports = { initSocketServer };
