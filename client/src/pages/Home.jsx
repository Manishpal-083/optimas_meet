import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeeting } from '../context/MeetingContext';
import Navbar from '../components/layout/Navbar';
import { Video, Keyboard, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Home = () => {
  const { token, user } = useAuth();
  const { setRoomId, setMeetingTitle } = useMeeting();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Action 1: Create a room
  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_URL}/meetings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${user?.name || 'Optimas'}'s Meeting Room`
        })
      });

      const result = await response.json();

      if (result.success) {
        const roomData = result.data;
        setRoomId(roomData.roomId);
        setMeetingTitle(roomData.title);
        navigate(`/meeting/${roomData.roomId}`);
      } else {
        setErrorMsg(result.message || 'Failed to create meeting room.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error, please check connection.');
    } finally {
      setIsCreating(false);
    }
  };

  // Action 2: Join an existing room
  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    
    setIsJoining(true);
    setErrorMsg('');
    
    // Normalize user room code input (e.g. clean whitespaces)
    const sanitizedRoomId = joinRoomId.replace(/\s+/g, '').trim();

    try {
      const response = await fetch(`${API_URL}/meetings/validate/${sanitizedRoomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setRoomId(result.data.roomId);
        setMeetingTitle(result.data.title);
        navigate(`/meeting/${result.data.roomId}`);
      } else {
        setErrorMsg(result.message || 'Room code invalid or meeting has ended.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error checking room validation.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col mesh-bg min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Hand: App Value Proposition Pitch */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold font-display">
              <Sparkles className="h-3.5 w-3.5" /> Launching Phase 1 Foundation
            </div>
            
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              Premium meetings. <br />
              <span className="text-gradient">Engineered for everyone.</span>
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              Optimas Meet delivers low-latency WebRTC media pipelines, secure JWT token validation, and real-time state coordination via Socket.io.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Mesh topology WebRTC audio & video streams
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Secure JWT Session Gateways
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Integrated chat framework boilerplate
              </li>
            </ul>
          </div>

          {/* Right Hand: Action Portal Card */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] brand-gradient" />

              <h2 className="font-display font-bold text-xl text-white mb-6">
                Get Started
              </h2>

              {errorMsg && (
                <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Option A: Create a Meeting */}
                <div>
                  <button
                    onClick={handleCreateMeeting}
                    disabled={isCreating || isJoining}
                    className="w-full flex h-12 items-center justify-center rounded-xl brand-gradient hover:scale-[1.01] text-white font-display font-semibold text-sm tracking-wide gap-2.5 transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isCreating ? (
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Video className="h-4.5 w-4.5" />
                        Create New Meeting
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5 font-light">
                    Instantly generates a unique room link and sets you as host.
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center text-slate-600 gap-3 text-xs uppercase font-bold tracking-widest font-display">
                  <div className="flex-1 h-px bg-white/5" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Option B: Join via Room Code */}
                <form onSubmit={handleJoinMeeting} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">
                      Enter Room Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                        <Keyboard className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="abc-defg-hij"
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input"
                        required
                        disabled={isCreating || isJoining}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating || isJoining || !joinRoomId.trim()}
                    className="w-full flex h-11 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-white/5 hover:bg-slate-700 font-display font-semibold text-sm tracking-wide gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isJoining ? (
                      <span className="h-5 w-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    ) : (
                      <>
                        Join Meeting
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
export default Home;
