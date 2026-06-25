import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
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

  // Initialize camera and microphone devices
  const startLocalStream = useCallback(async () => {
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
    if (localStream) {
      console.log('[Media] Stopping local hardware streams...');
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // Audio mute toggler
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Video feed toggler
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

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

    if (onTrackSwap && typeof onTrackSwap === 'function' && localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      if (cameraTrack) {
        onTrackSwap(cameraTrack);
      }
    }

    setIsScreenSharing(false);
  }, [localStream]);

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
