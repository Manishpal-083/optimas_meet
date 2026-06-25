import React from 'react';
import VideoTile from './VideoTile';
import { useMeeting } from '../../context/MeetingContext';
import { useAuth } from '../../context/AuthContext';

export const VideoGrid = () => {
  const { localStream, participants, isAudioMuted, isVideoMuted } = useMeeting();
  const { user } = useAuth();

  const totalTiles = (localStream ? 1 : 0) + participants.length;

  // Compute layout columns based on number of active feeds
  const getGridLayoutClass = () => {
    if (totalTiles <= 1) return 'grid-cols-1 max-w-3xl';
    if (totalTiles === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl';
    if (totalTiles <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className={`grid gap-4 sm:gap-6 w-full ${getGridLayoutClass()}`}>
        
        {/* 1. Local Video Feed */}
        {localStream && (
          <VideoTile
            stream={localStream}
            userName={user ? user.name : 'Local User'}
            isLocal={true}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
          />
        )}

        {/* 2. Remote Video Feeds */}
        {participants.map((peer) => (
          <VideoTile
            key={peer.socketId}
            stream={peer.stream}
            userName={peer.userName}
            isLocal={false}
            isAudioMuted={peer.audioMuted || false}
            isVideoMuted={peer.videoMuted || false}
          />
        ))}

        {/* 3. Empty Room Landing State Placeholder */}
        {totalTiles === 0 && (
          <div className="text-center py-16 flex flex-col items-center justify-center text-slate-500">
            <div className="h-16 w-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-4">
              ⚠️
            </div>
            <p className="font-display font-medium text-slate-400">No media streams configured</p>
            <p className="text-xs text-slate-600 mt-1">Check camera authorizations to start feed</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default VideoGrid;
