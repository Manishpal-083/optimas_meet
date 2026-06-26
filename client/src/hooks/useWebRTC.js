import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useMeeting } from '../context/MeetingContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // In production, add TURN servers here
  ],
};

export const useWebRTC = () => {
  const { socket } = useSocket();
  const { 
    roomId, 
    localStream, 
    setParticipants, 
    participants 
  } = useMeeting();

  // Keep references to peer connections: { [socketId]: RTCPeerConnection }
  const peerConnections = useRef({});

  // Clean up a specific peer connection
  const closePeerConnection = useCallback((socketId) => {
    if (peerConnections.current[socketId]) {
      console.log(`[WebRTC] Closing peer connection for: ${socketId}`);
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
  }, []);

  // Track replacement helper (e.g. for screenshare toggling)
  const replaceVideoTrack = useCallback((newTrack) => {
    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });
  }, []);

  // Create an RTCPeerConnection instance
  const createPeerConnection = useCallback((targetSocketId, targetUserName, isInitiator) => {
    console.log(`[WebRTC] Creating RTCPeerConnection for ${targetSocketId} (${targetUserName}), initiator: ${isInitiator}`);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    // Add local media tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // ICE Candidate handler: broadcast ICE candidates to the target peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state changes logging
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection status for ${targetSocketId}: ${pc.connectionState}`);
      
      setParticipants((prev) => {
        return prev.map((p) => {
          if (p.socketId === targetSocketId) {
            return { ...p, connectionStatus: pc.connectionState };
          }
          return p;
        });
      });

      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        closePeerConnection(targetSocketId);
        setParticipants((prev) => prev.filter((p) => p.socketId !== targetSocketId));
      }
    };

    // Track stream additions from remote peer
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote media track from: ${targetSocketId}`);
      const remoteStream = event.streams[0];

      setParticipants((prev) => {
        const index = prev.findIndex((p) => p.socketId === targetSocketId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], stream: remoteStream };
          return updated;
        }
        return prev;
      });
    };

    return pc;
  }, [localStream, socket, closePeerConnection, setParticipants]);

  useEffect(() => {
    if (!socket || !roomId || !localStream) return;

    // 1. Receive users already in room
    const handleRoomUsers = async (otherUsers) => {
      console.log('[WebRTC] Room users received:', otherUsers);
      
      // Initialize participant placeholder records
      setParticipants(otherUsers.map(u => ({ 
        ...u, 
        stream: null, 
        connectionStatus: 'connecting' 
      })));

      // Initiate WebRTC offers to everyone already in the room
      for (const peer of otherUsers) {
        try {
          const pc = createPeerConnection(peer.socketId, peer.userName, true);
          
          // Create SDP Offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          // Signal offer to target peer
          socket.emit('sdp-offer', {
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (err) {
          console.error(`[WebRTC] Failed to send offer to ${peer.socketId}:`, err);
        }
      }
    };

    // 2. Receive connection notifications from new users
    const handleUserConnected = ({ socketId, userId, userName, audioMuted, videoMuted }) => {
      console.log(`[WebRTC] Peer joined room: ${userName} (${socketId})`);
      
      // Register placeholder for new user
      setParticipants((prev) => {
        if (prev.some(p => p.socketId === socketId)) return prev;
        return [...prev, { 
          socketId, 
          userId, 
          userName, 
          stream: null, 
          audioMuted: !!audioMuted, 
          videoMuted: !!videoMuted,
          connectionStatus: 'connecting'
        }];
      });
    };

    // 3. Receive SDP Offers
    const handleSdpOffer = async ({ senderSocketId, offer }) => {
      console.log(`[WebRTC] Received SDP Offer from ${senderSocketId}`);
      
      try {
        // Resolve actual userName from active participant list
        let resolvedUserName = 'Peer';
        setParticipants((prev) => {
          const match = prev.find(p => p.socketId === senderSocketId);
          if (match) {
            resolvedUserName = match.userName;
          }
          return prev;
        });

        // Create peer connection (this user is the receiver, so isInitiator is false)
        const pc = createPeerConnection(senderSocketId, resolvedUserName, false);
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create SDP Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Signal answer back
        socket.emit('sdp-answer', {
          targetSocketId: senderSocketId,
          answer,
        });
      } catch (err) {
        console.error(`[WebRTC] Failed to handle incoming SDP offer from ${senderSocketId}:`, err);
      }
    };

    // 4. Receive SDP Answers
    const handleSdpAnswer = async ({ senderSocketId, answer }) => {
      console.log(`[WebRTC] Received SDP Answer from ${senderSocketId}`);
      const pc = peerConnections.current[senderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error(`[WebRTC] Failed to set remote description for ${senderSocketId}:`, err);
        }
      }
    };

    // 5. Receive ICE Candidates
    const handleIceCandidate = async ({ senderSocketId, candidate }) => {
      const pc = peerConnections.current[senderSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error(`[WebRTC] Failed to add ICE candidate from ${senderSocketId}:`, err);
        }
      }
    };

    // 6. Peer disconnected
    const handleUserDisconnected = ({ socketId, userName }) => {
      console.log(`[WebRTC] Peer disconnected: ${userName || socketId}`);
      closePeerConnection(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // 7. Peer mute toggled
    const handlePeerMuteToggle = ({ socketId, audioMuted, videoMuted }) => {
      setParticipants((prev) => {
        return prev.map((p) => {
          if (p.socketId === socketId) {
            return { ...p, audioMuted, videoMuted };
          }
          return p;
        });
      });
    };

    // Register socket listeners
    socket.on('room-users', handleRoomUsers);
    socket.on('user-connected', handleUserConnected);
    socket.on('sdp-offer', handleSdpOffer);
    socket.on('sdp-answer', handleSdpAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('peer-mute-toggle', handlePeerMuteToggle);

    // Clean up connections on unmount/stream changes
    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-connected', handleUserConnected);
      socket.off('sdp-offer', handleSdpOffer);
      socket.off('sdp-answer', handleSdpAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('peer-mute-toggle', handlePeerMuteToggle);

      console.log('[WebRTC] Resetting all peer connection tracks...');
      Object.keys(peerConnections.current).forEach(closePeerConnection);
    };
  }, [socket, roomId, localStream, createPeerConnection, closePeerConnection, setParticipants]);

  return {
    peerConnections: peerConnections.current,
    replaceVideoTrack,
  };
};
export default useWebRTC;
