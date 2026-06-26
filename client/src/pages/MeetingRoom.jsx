import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMeeting } from '../context/MeetingContext';
import { useWebRTC } from '../hooks/useWebRTC';
import Navbar from '../components/layout/Navbar';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingControls from '../components/meeting/MeetingControls';
import { Send, Users, MessageSquare, X, Info, Copy, Check, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';

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
  const [mediaError, setMediaError] = useState(null); // 'permission-denied' | 'no-devices' | 'unknown'

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
        
        // Start local video camera stream
        localStreamInstance = await startLocalStream();
        
        // Emit Socket join-room event with initial mute states
        if (socket && isConnected) {
          socket.emit('join-room', {
            roomId,
            userId: user.id,
            userName: user.name,
            audioMuted: initialMuteStates.current.audio,
            videoMuted: initialMuteStates.current.video
          });
        }
      } catch (err) {
        console.error('Session setup failure:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('permission-denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMediaError('no-devices');
        } else {
          setMediaError('unknown');
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
  }, [roomId, socket, isConnected, user, setRoomId, startLocalStream, resetMeetingState]);

  // Socket chat messaging listener
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket]);

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

  const handleLeaveCall = () => {
    if (socket) {
      socket.emit('leave-room');
    }
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen overflow-hidden">
      
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Room Information Ribbon */}
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

      {/* 3. Central Working Area: Video Grid + Optional Sidebar Chat/Participants Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Loading Overlay */}
        {isMediaLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center text-slate-300">
            <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="font-display font-bold text-base tracking-wide text-white">Setting up your media feed...</p>
            <p className="text-xs text-slate-500 font-light mt-1.5">Please authorize camera and microphone permissions when prompted.</p>
          </div>
        )}

        {/* Permission Denied / Error Overlay */}
        {mediaError && (
          <div className="absolute inset-0 z-30 bg-slate-950/98 flex items-center justify-center p-6">
            <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-rose-500/10 shadow-2xl space-y-5 text-center">
              <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg text-slate-200">
                  {mediaError === 'permission-denied' ? 'Camera & Mic Access Blocked' : 'Media Devices Not Found'}
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
                  {mediaError === 'permission-denied' 
                    ? "Optimas Meet was blocked from accessing your camera and microphone. Please click the icon in your browser's address bar to restore permissions, then select 'Try Again'." 
                    : "No audio or video input devices were detected on your system. Please attach a camera and microphone, then select 'Try Again'."}
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
                  onClick={handleLeaveCall}
                  className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-white/5 font-display font-semibold text-xs tracking-wide transition-all active:scale-[0.99] cursor-pointer"
                >
                  Leave Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video stream viewport */}
        {!mediaError && <VideoGrid />}

        {/* Floating Sidebar Drawer */}
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
                      <span className="text-xs font-semibold text-slate-200 font-display">{user?.name} <span className="text-[10px] text-indigo-400 font-light">(You)</span></span>
                      <span className="text-[9px] text-indigo-400 font-medium">Host • Connected</span>
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
                              {/* Connection status indicator dot */}
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

                {/* Chat submit panel */}
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

      {/* 4. Controls Toolbar Panel */}
      <MeetingControls 
        onLeave={handleLeaveCall} 
        onTrackSwap={replaceVideoTrack}
      />
    </div>
  );
};
export default MeetingRoom;
