// WebRTC Signaling Event Coordinator.
// Handles SDP negotiations and ICE candidate relaying between peers.

const rooms = {}; // In-memory active room registry: { [roomId]: { [socketId]: { userId, userName } } }

const registerWebRTCHandlers = (io, socket) => {
  
  // 1. Join Room
  socket.on('join-room', ({ roomId, userId, userName, audioMuted, videoMuted }) => {
    console.log(`[Socket] User ${userName} (${userId}) joining room ${roomId}`);
    
    // Join socket room
    socket.join(roomId);
    
    // Store connection mapping
    socket.roomId = roomId;
    socket.userId = userId;
    socket.userName = userName;

    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }
    
    // Map socket ID to metadata
    rooms[roomId][socket.id] = { userId, userName, audioMuted: !!audioMuted, videoMuted: !!videoMuted };

    // Get list of other participants currently in the room
    const otherUsers = Object.keys(rooms[roomId])
      .filter((sid) => sid !== socket.id)
      .map((sid) => ({
        socketId: sid,
        userId: rooms[roomId][sid].userId,
        userName: rooms[roomId][sid].userName,
        audioMuted: rooms[roomId][sid].audioMuted,
        videoMuted: rooms[roomId][sid].videoMuted
      }));

    // Send back current users list to the joining user
    socket.emit('room-users', otherUsers);

    // Notify all existing participants in the room that a new peer has connected
    socket.to(roomId).emit('user-connected', {
      socketId: socket.id,
      userId,
      userName,
      audioMuted: !!audioMuted,
      videoMuted: !!videoMuted
    });
  });

  // 2. Relay SDP Offer
  // In dynamic mesh WebRTC, one peer initiates an offer to a specific target peer
  socket.on('sdp-offer', ({ targetSocketId, offer }) => {
    console.log(`[WebRTC] Relay SDP Offer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('sdp-offer', {
      senderSocketId: socket.id,
      offer
    });
  });

  // 3. Relay SDP Answer
  // The receiving peer answers the offer and completes the description exchange
  socket.on('sdp-answer', ({ targetSocketId, answer }) => {
    console.log(`[WebRTC] Relay SDP Answer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('sdp-answer', {
      senderSocketId: socket.id,
      answer
    });
  });

  // 4. Relay ICE Candidate
  // Exchanging network pathways (NAT traversals/STUN/TURN)
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  // 5. Mute / Camera toggle event synchronization
  socket.on('mute-toggle', ({ audioMuted, videoMuted }) => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId][socket.id]) {
      rooms[roomId][socket.id].audioMuted = audioMuted;
      rooms[roomId][socket.id].videoMuted = videoMuted;
      
      socket.to(roomId).emit('peer-mute-toggle', {
        socketId: socket.id,
        audioMuted,
        videoMuted
      });
    }
  });

  // 6. Explicit Room Leave
  socket.on('leave-room', () => {
    handleUserLeaving(io, socket);
  });
};

const handleUserLeaving = (io, socket) => {
  const roomId = socket.roomId;
  
  if (roomId && rooms[roomId] && rooms[roomId][socket.id]) {
    const { userName } = rooms[roomId][socket.id];
    console.log(`[Socket] User ${userName} (${socket.userId}) leaving room ${roomId}`);
    
    // Remove client record
    delete rooms[roomId][socket.id];
    
    // Clean up empty room registry
    if (Object.keys(rooms[roomId]).length === 0) {
      delete rooms[roomId];
    } else {
      // Notify remaining clients
      io.to(roomId).emit('user-disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        userName
      });
    }

    // Leave Socket.io room
    socket.leave(roomId);
    
    // Clear mappings
    socket.roomId = null;
    socket.userId = null;
    socket.userName = null;
  }
};

module.exports = {
  registerWebRTCHandlers,
  handleUserLeaving,
};
