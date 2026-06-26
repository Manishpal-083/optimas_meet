import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';

const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState([]); // List of peers: { socketId, userId, userName, stream, audioMuted, videoMuted }
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Track screenshare track references to enable simple restoration
  const screenTrackRef = useRef(null);
  // Track local stream reference to avoid hook dependency loops
  const localStreamRef = useRef(null);

  // Initialize camera and microphone devices
  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      console.log('[Media] Local stream already active, reusing...');
      return localStreamRef.current;
    }
    try {
      console.log('[Media] Requesting camera/microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[Media] Failed to access hardware media devices:', error);
      // Fallback/Placeholder stream or alerting
      throw error;
    }
  }, []);

  // Gracefully stop all media tracks
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('[Media] Stopping local hardware streams...');
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  // Audio mute toggler
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuteState = !audioTrack.enabled;
        setIsAudioMuted(newMuteState);
        if (socket) {
          socket.emit('mute-toggle', { audioMuted: newMuteState, videoMuted: isVideoMuted });
        }
      }
    }
  }, [socket, isVideoMuted]);

  // Video feed toggler
  const toggleVideo = useCallback(async (onTrackSwap) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (!isVideoMuted) {
      // Turn OFF video
      console.log('[Media] Turning camera OFF...');
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        videoTrack.enabled = false;
      }
      setIsVideoMuted(true);
      if (socket) {
        socket.emit('mute-toggle', { audioMuted: isAudioMuted, videoMuted: true });
      }
    } else {
      // Turn ON video
      console.log('[Media] Turning camera ON...');
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        // Remove old track and add new one to the stream
        const oldTrack = stream.getVideoTracks()[0];
        if (oldTrack) {
          stream.removeTrack(oldTrack);
        }
        stream.addTrack(newVideoTrack);

        // Update localStream representation for local display
        const updatedStream = new MediaStream(stream.getTracks());
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);

        // Swap track in RTCPeerConnections
        if (onTrackSwap && typeof onTrackSwap === 'function') {
          onTrackSwap(newVideoTrack);
        }

        setIsVideoMuted(false);
        if (socket) {
          socket.emit('mute-toggle', { audioMuted: isAudioMuted, videoMuted: false });
        }
      } catch (err) {
        console.error('[Media] Failed to restart camera:', err);
        alert('Camera access denied or unavailable. Please check permissions.');
      }
    }
  }, [socket, isAudioMuted, isVideoMuted]);

  // Boilerplate Screen Share Trigger
  const toggleScreenShare = useCallback(async (onTrackSwap) => {
    if (!isScreenSharing) {
      try {
        console.log('[Media] Launching screenshare pipeline...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // When screen share track ends (via native browser UI)
        screenTrack.onended = () => {
          stopScreenShare(onTrackSwap);
        };

        if (onTrackSwap && typeof onTrackSwap === 'function') {
          // Callback hook to let the WebRTC connection layer swap out tracks
          onTrackSwap(screenTrack);
        }

        // Temporarily replace local stream representation for display
        // In full WebRTC apps, you'd manage multiple local streams
        setIsScreenSharing(true);
      } catch (error) {
        console.error('[Media] Failed to start screen sharing:', error);
      }
    } else {
      stopScreenShare(onTrackSwap);
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback((onTrackSwap) => {
    console.log('[Media] Stopping screen sharing...');
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    const stream = localStreamRef.current;
    if (onTrackSwap && typeof onTrackSwap === 'function' && stream) {
      const cameraTrack = stream.getVideoTracks()[0];
      if (cameraTrack) {
        onTrackSwap(cameraTrack);
      }
    }

    setIsScreenSharing(false);
  }, []);

  const resetMeetingState = useCallback(() => {
    stopLocalStream();
    setRoomId(null);
    setMeetingTitle('');
    setParticipants([]);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setIsChatOpen(false);
  }, [stopLocalStream]);

  const value = {
    roomId,
    setRoomId,
    meetingTitle,
    setMeetingTitle,
    participants,
    setParticipants,
    localStream,
    setLocalStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isChatOpen,
    setIsChatOpen,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    resetMeetingState,
  };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};
