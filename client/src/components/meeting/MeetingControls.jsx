import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, 
  MonitorUp, MonitorOff, MessageSquare, 
  PhoneOff, Settings, Shield
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';

export const MeetingControls = ({ onLeave, onTrackSwap }) => {
  const {
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isChatOpen,
    setIsChatOpen,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useMeeting();

  return (
    <div className="w-full glass border-t border-white/5 py-4 px-6 flex items-center justify-between">
      
      {/* 1. Left - Security Status Indicator */}
      <div className="hidden md:flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-slate-400 font-display font-medium tracking-wide flex items-center gap-1">
          <Shield className="h-3 w-3 text-emerald-400" /> End-to-End Encrypted
        </span>
      </div>

      {/* 2. Middle - Main Media Controllers */}
      <div className="flex items-center gap-3 mx-auto md:mx-0">
        
        {/* Toggle Audio */}
        <button
          onClick={toggleAudio}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shadow-md ${
            isAudioMuted 
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-white/5'
          }`}
          title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Toggle Video */}
        <button
          onClick={() => toggleVideo(onTrackSwap)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shadow-md ${
            isVideoMuted 
              ? 'bg-rose-500 text-white hover:bg-rose-600' 
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-white/5'
          }`}
          title={isVideoMuted ? "Start Camera" : "Stop Camera"}
        >
          {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={() => toggleScreenShare(onTrackSwap)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shadow-md ${
            isScreenSharing 
              ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-white/5'
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
        </button>

        {/* Toggle Chat Drawer */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shadow-md ${
            isChatOpen 
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-white/5'
          }`}
          title="Toggle Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Disconnect/Leave Call */}
        <button
          onClick={onLeave}
          className="flex h-11 px-5 items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 font-display font-semibold text-sm tracking-wide gap-2 transition-all duration-200 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 ml-2"
          title="Leave Meeting"
        >
          <PhoneOff className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* 3. Right - Device Settings Menu (Boilerplate placeholder) */}
      <div className="hidden md:flex items-center gap-2">
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all border border-transparent hover:border-white/5"
          title="Meeting Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
};
export default MeetingControls;
