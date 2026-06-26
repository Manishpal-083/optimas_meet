import React, { useEffect, useRef } from 'react';
import { MicOff, User, Volume2, Loader2, AlertTriangle } from 'lucide-react';

export const VideoTile = ({ 
  stream, 
  userName, 
  isLocal, 
  isAudioMuted, 
  isVideoMuted,
  connectionStatus = 'connected'
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideoPlaceholder = isVideoMuted || !stream;
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'checking';
  const isFailed = connectionStatus === 'failed' || connectionStatus === 'disconnected';

  return (
    <div className="relative group w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
      
      {/* Video Feed */}
      {!showVideoPlaceholder ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Avoid local echo feedback loop
          className="w-full h-full object-cover scale-x-[-1]" // mirror local camera feed
        />
      ) : (
        /* Video Muted / Off Avatar Placeholder */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border border-white/5 ring-4 ring-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
            <User className="h-10 w-10 text-indigo-400" />
          </div>
          <span className="mt-3 text-xs font-medium font-display tracking-wider text-slate-400">
            Video Off
          </span>
        </div>
      )}

      {/* WebRTC Connection Status Spinner Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-300">
          <Loader2 className="h-7 w-7 text-indigo-400 animate-spin mb-2" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-display">Connecting Peer...</span>
        </div>
      )}

      {/* WebRTC Connection Status Failed Overlay */}
      {isFailed && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-rose-400">
          <AlertTriangle className="h-8 w-8 text-rose-500 mb-2 animate-bounce" />
          <span className="text-[10px] uppercase font-bold tracking-wider font-display">Connection Lost</span>
        </div>
      )}

      {/* Participant Name Badge Overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1.5 backdrop-blur-md border border-white/5 shadow-lg">
        <span className="text-xs font-semibold text-slate-200 font-display">
          {userName} {isLocal && <span className="text-indigo-400 font-light text-[10px] ml-1">(You)</span>}
        </span>
      </div>

      {/* Muted Indicator / Status Icons Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {isAudioMuted && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/90 text-white backdrop-blur-md shadow-lg border border-rose-400/20">
            <MicOff className="h-4 w-4" />
          </div>
        )}
        {!isAudioMuted && !isLocal && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/80 text-white backdrop-blur-md shadow-lg border border-indigo-400/20 animate-pulse-slow">
            <Volume2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Overlay Glow Highlight */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/10 rounded-2xl pointer-events-none transition-colors" />
    </div>
  );
};
export default VideoTile;
