// Chat Socket Event Coordinator.
// Handles message distribution, active typing status notifications, and reactions.

const registerChatHandlers = (io, socket) => {
  
  // 1. Relaying text messages
  socket.on('send-message', ({ text, time, senderName }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    console.log(`[Chat] Message in ${roomId} from ${senderName}: "${text.substring(0, 20)}..."`);
    
    // Broadcast to room (including sender if requested, or use socket.to for others only)
    io.to(roomId).emit('receive-message', {
      id: Math.random().toString(36).substring(2, 9),
      text,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName,
      senderSocketId: socket.id,
      senderUserId: socket.userId
    });
  });

  // 2. Relay Typing status
  socket.on('typing', ({ isTyping }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    socket.to(roomId).emit('peer-typing', {
      userName: socket.userName,
      isTyping
    });
  });

  // 3. Relay reaction (e.g. thumbs up, hearts)
  socket.on('send-reaction', ({ type }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    socket.to(roomId).emit('peer-reaction', {
      userName: socket.userName,
      type // 'thumb' | 'heart' | 'clap' | 'laugh'
    });
  });
};

module.exports = { registerChatHandlers };
