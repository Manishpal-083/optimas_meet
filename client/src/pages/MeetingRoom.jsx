import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMeeting } from '../context/MeetingContext';
import { useWebRTC } from '../hooks/useWebRTC';
import Navbar from '../components/layout/Navbar';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingControls from '../components/meeting/MeetingControls';
import { Send, Users, MessageSquare, X, Info, Copy, Check } from 'lucide-react';

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
    participants
  } = useMeeting();

  // Local Chat states
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize WebRTC signaling hooks
  const { replaceVideoTrack } = useWebRTC();

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Connect local hardware media & socket room channel
  useEffect(() => {
    let localStreamInstance = null;

    const setupSession = async () => {
      try {
        setRoomId(roomId);
        
        // Start local video camera stream
        localStreamInstance = await startLocalStream();
        
        // Emit Socket join-room event
        if (socket && isConnected) {
          socket.emit('join-room', {
            roomId,
            userId: user.id,
            userName: user.name,
          });
        }
      } catch (err) {
        console.error('Session setup failure:', err);
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

      {/* 3. Central Working Area: Video Grid + Optional Sidebar Chat Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Video stream viewport */}
        <VideoGrid />

        {/* Floating Chat Panel Drawer */}
        {isChatOpen && (
          <aside className="w-full sm:w-85 border-l border-white/5 glass flex flex-col h-full z-20 animate-slide-in relative shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm tracking-wide flex items-center gap-2 text-slate-200">
                <MessageSquare className="h-4 w-4 text-indigo-400" /> In-Call Chat
              </h3>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat message logs */}
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
