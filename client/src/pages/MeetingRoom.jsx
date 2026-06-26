import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMeeting } from '../context/MeetingContext';
import { useWebRTC } from '../hooks/useWebRTC';
import meetingService from '../services/meeting.service';
import Navbar from '../components/layout/Navbar';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingControls from '../components/meeting/MeetingControls';
import { 
  Send, Users, MessageSquare, X, Info, 
  Copy, Check, Mic, MicOff, Video, VideoOff, AlertCircle 
} from 'lucide-react';

export const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const {
    meetingTitle,
    setRoomId,
    setMeetingTitle,
    startLocalStream,
    resetMeetingState,
    isChatOpen,
    setIsChatOpen,
    participants,
    isAudioMuted,
    isVideoMuted
  } = useMeeting();

  // Local Chat states
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatEndRef = useRef(null);

  // Layout & Media states
  const [drawerTab, setDrawerTab] = useState('participants'); // 'chat' | 'participants'
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null); // 'permission-denied' | 'no-devices' | 'invalid-room' | 'unknown'
  const [isHost, setIsHost] = useState(false);
  const [roomState, setRoomState] = useState('loading'); // 'loading' | 'waiting' | 'active' | 'denied' | 'error'
  const [joinRequests, setJoinRequests] = useState([]); // List of incoming guests: { socketId, userId, userName }
  const [joinErrorMessage, setJoinErrorMessage] = useState('');

  // Initialize WebRTC signaling hooks
  const { replaceVideoTrack } = useWebRTC();

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Reference mute states to prevent dependency recalculation re-triggers
  const initialMuteStates = useRef({ audio: isAudioMuted, video: isVideoMuted });

  // Connect local hardware media & socket room channel
  useEffect(() => {
    let localStreamInstance = null;

    const setupSession = async () => {
      try {
        setIsMediaLoading(true);
        setRoomId(roomId);
        setMediaError(null);
        
        // Validate room exists and fetch hostId
        const validation = await meetingService.validateMeeting(roomId);
        if (!validation.success) {
          throw new Error('invalid-room');
        }
        
        const hostId = validation.data.hostId;
        const currentIsHost = user && user.id === hostId;
        setIsHost(currentIsHost);
        setMeetingTitle(validation.data.title);
        
        // Start local video camera stream
        localStreamInstance = await startLocalStream();
        
        if (currentIsHost) {
          setRoomState('active');
          if (socket && isConnected) {
            socket.emit('join-room', {
              roomId,
              userId: user.id,
              userName: user.name,
              audioMuted: initialMuteStates.current.audio,
              videoMuted: initialMuteStates.current.video
            });
          }
        } else {
          setRoomState('waiting');
          if (socket && isConnected) {
            socket.emit('request-join', {
              roomId,
              userId: user.id,
              userName: user.name
            });
          }
        }
      } catch (err) {
        console.error('Session setup failure:', err);
        const errorName = err.name || err.message;
        if (errorName === 'invalid-room' || err.message === 'invalid-room' || (err.response && err.response.status === 404)) {
          setMediaError('invalid-room');
          setRoomState('error');
        } else if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setMediaError('permission-denied');
          setRoomState('error');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setMediaError('no-devices');
          setRoomState('error');
        } else {
          setMediaError('unknown');
          setRoomState('error');
        }
      } finally {
        setIsMediaLoading(false);
      }
    };

    setupSession();

    return () => {
      console.log('[MeetingRoom] Unmounting room, resetting state...');
      if (socket) {
        socket.emit('leave-room');
      }
      resetMeetingState();
    };
  }, [roomId, socket, isConnected, user, setRoomId, setMeetingTitle, startLocalStream, resetMeetingState]);

  // Socket chat & host-approval flow listeners
  useEffect(() => {
    if (!socket) return;

    // Chat listeners
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Host approval request listener
    const handleJoinRequest = ({ socketId, userId, userName }) => {
      console.log(`[Host] Received join request from: ${userName} (${socketId})`);
      setJoinRequests((prev) => {
        if (prev.some((req) => req.socketId === socketId)) return prev;
        return [...prev, { socketId, userId, userName }];
      });
    };

    // Guest listeners
    const handleJoinApproved = () => {
      console.log('[Guest] Admitted to room by host!');
      setRoomState('active');
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        userName: user.name,
        audioMuted: initialMuteStates.current.audio,
        videoMuted: initialMuteStates.current.video
      });
    };

    const handleJoinDenied = () => {
      console.warn('[Guest] Admission request denied by host.');
      setRoomState('denied');
      setTimeout(() => {
        navigate('/');
      }, 4000);
    };

    const handleJoinError = ({ message }) => {
      console.error('[Guest] Admission request error:', message);
      setRoomState('error');
      setMediaError('unknown');
      setJoinErrorMessage(message);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('join-request', handleJoinRequest);
    socket.on('join-approved', handleJoinApproved);
    socket.on('join-denied', handleJoinDenied);
    socket.on('join-error', handleJoinError);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('join-request', handleJoinRequest);
      socket.off('join-approved', handleJoinApproved);
      socket.off('join-denied', handleJoinDenied);
      socket.off('join-error', handleJoinError);
    };
  }, [socket, roomId, user, navigate]);

  // Copy room link helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Submit text message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !socket) return;

    socket.emit('send-message', {
      text: typedMessage,
      senderName: user.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setTypedMessage('');
  };

  const handleApproveJoin = (socketId) => {
    if (socket) {
      socket.emit('approve-join', { targetSocketId: socketId });
      setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
    }
  };

  const handleDenyJoin = (socketId) => {
    if (socket) {
      socket.emit('deny-join', { targetSocketId: socketId });
      setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
    }
  };

  const handleLeaveCall = () => {
    if (socket) {
      socket.emit('leave-room');
    }
    navigate('/');
  };

  // Render loading overlay on initial media load
  if (roomState === 'loading' || isMediaLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <span className="font-display font-medium text-sm tracking-wide">
          Verifying meeting details and camera access...
        </span>
      </div>
    );
  }

  // Render invalid room / generic setup error
  if (roomState === 'error' && mediaError) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-rose-500/10 shadow-2xl space-y-5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500" />
          <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-slate-200">
              {mediaError === 'invalid-room' ? 'Meeting Not Found' : mediaError === 'permission-denied' ? 'Camera & Mic Access Blocked' : 'Media Setup Error'}
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
              {mediaError === 'invalid-room' 
                ? "The meeting code you entered is invalid, or the session has already ended. Please check with your host and try again." 
                : mediaError === 'permission-denied' 
                ? "Optimas Meet was blocked from accessing your camera and microphone. Please click the camera icon in your address bar to restore access, then reload the page."
                : joinErrorMessage || "An unexpected error occurred while setting up your devices. Please refresh the browser."}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-10 rounded-xl brand-gradient hover:scale-[1.01] text-white font-display font-semibold text-xs tracking-wide transition-all active:scale-[0.99] cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-white/5 font-display font-semibold text-xs tracking-wide transition-all active:scale-[0.99] cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Denied Entry
  if (roomState === 'denied') {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-rose-500/10 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500" />
          <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto animate-pulse">
            <X className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl text-slate-200">Admission Refused</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
              The meeting host has declined your request to join. Redirecting you to the dashboard...
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full h-10 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-white/5 font-display font-semibold text-xs tracking-wide transition-all cursor-pointer"
            >
              Return to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Guest Waiting Room
  if (roomState === 'waiting') {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen overflow-hidden">
        <Navbar />
        
        {/* Waiting Room Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {/* Left Preview: Video preview tile */}
          <div className="w-full lg:w-3/5 aspect-video relative rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl shrink-0">
            {localStream ? (
              <video
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                Camera starting...
              </div>
            )}
            <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-slate-950/80 px-3 py-1.5 backdrop-blur-md border border-white/5 text-xs text-slate-200 font-display font-semibold">
              Preview Feed (Camera On)
            </div>
          </div>

          {/* Right Status Card */}
          <div className="w-full lg:w-2/5 glass-card rounded-2xl p-6 border border-white/5 shadow-2xl space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                Waiting Room
              </span>
              <h2 className="font-display font-extrabold text-xl text-white">Knocking on the room door...</h2>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                We've notified the meeting host that you'd like to join. Once they approve your request, you'll be let in automatically.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-500 font-light">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Awaiting host confirmation...</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLeaveCall}
                className="w-full h-11 rounded-xl bg-rose-500 text-white hover:bg-rose-600 font-display font-semibold text-xs tracking-wide transition-all active:scale-[0.99] cursor-pointer"
              >
                Cancel and Leave Call
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Host or Admitted Guest - Main Video Room Workspace
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen overflow-hidden relative">
      
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Top Admission requests Banner for Host */}
      {isHost && joinRequests.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl animate-float">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-display uppercase font-bold text-xs">
                {joinRequests[0].userName.substring(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 font-display">{joinRequests[0].userName}</span>
                <span className="text-[10px] text-slate-500 font-light">wants to join this call</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleApproveJoin(joinRequests[0].socketId)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-[10px] tracking-wide uppercase transition-colors cursor-pointer"
              >
                Admit
              </button>
              <button
                onClick={() => handleDenyJoin(joinRequests[0].socketId)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 font-display font-bold text-[10px] tracking-wide uppercase transition-colors cursor-pointer"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 3. Room Information Ribbon */}
      <div className="bg-slate-900/60 border-b border-white/5 py-2.5 px-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-display font-semibold text-slate-200 text-sm">
            {meetingTitle || 'Active Call'}
          </span>
          <span className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-white/5 font-mono">
            <span>Room Code: {roomId}</span>
            <button 
              onClick={handleCopyLink} 
              className="text-slate-400 hover:text-white ml-1 p-0.5 cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-display font-medium text-indigo-400 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {participants.length + 1} Connected
          </span>
        </div>
      </div>

      {/* 4. Central Working Area: Video Grid + Optional Sidebar Chat/Participants Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <VideoGrid />

        {/* Sidebar Drawer */}
        {isChatOpen && (
          <aside className="w-full sm:w-85 border-l border-white/5 glass flex flex-col h-full z-20 animate-slide-in relative shrink-0">
            {/* Drawer Tab Headers */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setDrawerTab('participants')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-display font-bold transition-all cursor-pointer ${
                    drawerTab === 'participants'
                      ? 'brand-gradient text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Participants ({participants.length + 1})
                </button>
                <button
                  onClick={() => setDrawerTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-display font-bold transition-all cursor-pointer ${
                    drawerTab === 'chat'
                      ? 'brand-gradient text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Chat
                </button>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* View A: Participants List */}
            {drawerTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Local User */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="flex items-center gap-2.5">
                    <img src={user?.avatarUrl} alt={user?.name} className="h-8 w-8 rounded-full ring-2 ring-indigo-500/20" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 font-display">{user?.name} {isHost && <span className="text-[10px] text-indigo-400 font-semibold">(Host)</span>} <span className="text-[10px] text-indigo-400 font-light">(You)</span></span>
                      <span className="text-[9px] text-indigo-400 font-medium">{isHost ? 'Host' : 'Participant'} • Connected</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 text-slate-400">
                    <span className={`p-1 rounded bg-slate-900 border border-white/5 ${isAudioMuted ? 'text-rose-400' : 'text-slate-400'}`}>
                      {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`p-1 rounded bg-slate-900 border border-white/5 ${isVideoMuted ? 'text-rose-400' : 'text-slate-400'}`}>
                      {isVideoMuted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </div>

                {/* Remote Participants */}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-display px-1">Other Peers</p>
                  {participants.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6 italic">Waiting for others to join...</p>
                  ) : (
                    participants.map((peer) => {
                      const isConnecting = peer.connectionStatus === 'connecting' || !peer.connectionStatus;
                      const isFailed = peer.connectionStatus === 'failed' || peer.connectionStatus === 'disconnected';
                      return (
                        <div key={peer.socketId} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xs text-slate-400 font-display uppercase font-bold">
                                {peer.userName.substring(0, 2)}
                              </div>
                              <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${
                                isFailed ? 'bg-rose-500' : isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                              }`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-200 font-display truncate max-w-[120px]">{peer.userName}</span>
                              <span className="text-[9px] text-slate-500 capitalize">{peer.connectionStatus || 'connecting'}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 text-slate-400">
                            <span className={`p-1 rounded bg-slate-950 border border-white/5 ${peer.audioMuted ? 'text-rose-400' : 'text-slate-400'}`}>
                              {peer.audioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            </span>
                            <span className={`p-1 rounded bg-slate-950 border border-white/5 ${peer.videoMuted ? 'text-rose-400' : 'text-slate-400'}`}>
                              {peer.videoMuted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* View B: Chat Drawer Panel */}
            {drawerTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                      <Info className="h-8 w-8 text-slate-600 mb-2" />
                      <p className="text-xs font-display font-medium">Welcome to the call chat!</p>
                      <p className="text-[10px] text-slate-600 mt-1">Messages sent here are visible to all room peers.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwnMessage = msg.senderUserId === user?.id || msg.senderName === user?.name;
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-semibold text-slate-400 font-display">
                              {isOwnMessage ? 'You' : msg.senderName}
                            </span>
                            <span className="text-[9px] text-slate-600 font-light">{msg.time}</span>
                          </div>
                          <div className={`p-3 rounded-2xl text-xs max-w-[85%] break-words ${
                            isOwnMessage 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-950/60">
                  <div className="relative">
                    <input
                      type="text"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      placeholder="Type message..."
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl text-xs glass-input"
                      required
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg brand-gradient flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </aside>
        )}
      </div>

      {/* 5. Controls Toolbar Panel */}
      <MeetingControls 
        onLeave={handleLeaveCall} 
        onTrackSwap={replaceVideoTrack}
      />
    </div>
  );
};

export default MeetingRoom;
