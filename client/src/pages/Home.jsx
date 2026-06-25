import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeeting } from '../context/MeetingContext';
import meetingService from '../services/meeting.service';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { 
  Video, Keyboard, ArrowRight, Sparkles, 
  CheckCircle2, AlertCircle, Calendar, 
  Clock, ShieldAlert, Award, Clock3 
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const { setRoomId, setMeetingTitle } = useMeeting();
  
  const [joinRoomId, setJoinRoomId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const navigate = useNavigate();

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic welcome greeting
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format date display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Action 1: Create a room via Axios service
  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setErrorMsg('');
    try {
      const result = await meetingService.createMeeting(`${user?.name || 'Optimas'}'s Meeting Room`);
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
      setErrorMsg(err.message || 'Network error creating meeting room.');
    } finally {
      setIsCreating(false);
    }
  };

  // Action 2: Join a room via Axios service
  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    setIsJoining(true);
    setErrorMsg('');
    const sanitizedRoomId = joinRoomId.replace(/\s+/g, '').trim();

    try {
      const result = await meetingService.validateMeeting(sanitizedRoomId);
      if (result.success) {
        setRoomId(result.data.roomId);
        setMeetingTitle(result.data.title);
        navigate(`/meeting/${result.data.roomId}`);
      } else {
        setErrorMsg(result.message || 'Room code invalid or meeting has ended.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Room validation failed. Please check room code.');
    } finally {
      setIsJoining(false);
    }
  };

  // Mock list of recent meetings
  const recentMeetings = [
    { id: '1', title: 'Sprint Planning Sync', roomId: 'qwe-rtyu-iop', date: 'Yesterday', duration: '45 mins', host: 'Alex Reed' },
    { id: '2', title: 'Optimas Architecture Review', roomId: 'asd-fghj-klz', date: 'June 23, 2026', duration: '1 hr 15m', host: 'John Doe (You)' },
    { id: '3', title: 'AI Module Kickoff Meeting', roomId: 'zxc-vbnm-qwe', date: 'June 20, 2026', duration: '30 mins', host: 'Sophia Chen' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen overflow-hidden">
      
      {/* Navbar */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar />

        {/* Core Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto mesh-bg p-6 sm:p-8 space-y-8">
          
          {/* Welcome Banner Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 p-6 rounded-2xl border border-white/5 shadow-xl">
            <div className="space-y-1">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2">
                {getGreeting()}, <span className="text-gradient">{user?.name || 'Friend'}</span>!
              </h1>
              <p className="text-xs text-slate-400 font-light">
                Welcome back to your workspace. Start a new session or join an active call.
              </p>
            </div>
            
            <div className="text-left md:text-right shrink-0">
              <div className="text-sm font-semibold text-indigo-400 font-display flex items-center gap-1.5 md:justify-end">
                <Clock className="h-4 w-4" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-500 font-light mt-0.5">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Left Workspace Panel: Action Portal + Recent History */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel A: New Meeting */}
                <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-56 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] brand-gradient group-hover:scale-x-105 transition-transform" />
                  
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-lg brand-gradient flex items-center justify-center text-white shadow-md">
                      <Video className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-200 mt-3">Start Meeting</h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      Instantly initialize a secure WebRTC video room, and generate sharing invites for your team.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateMeeting}
                    disabled={isCreating || isJoining}
                    className="w-full flex h-10.5 items-center justify-center rounded-xl brand-gradient hover:scale-[1.01] text-white font-display font-semibold text-xs tracking-wide gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-4"
                  >
                    {isCreating ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create New Meeting
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Panel B: Join Call via Room Code */}
                <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-56 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-700" />
                  
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-indigo-400 shadow-md">
                      <Keyboard className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-200 mt-3">Join with Code</h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      Enter a structured meeting room identifier to join an ongoing session.
                    </p>
                  </div>

                  <form onSubmit={handleJoinMeeting} className="flex gap-2 mt-4">
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="abc-defg-hij"
                      className="flex-1 px-3 py-2 rounded-xl text-xs glass-input"
                      required
                      disabled={isCreating || isJoining}
                    />
                    <button
                      type="submit"
                      disabled={isCreating || isJoining || !joinRoomId.trim()}
                      className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 flex items-center justify-center transition-all cursor-pointer"
                    >
                      {isJoining ? (
                        <span className="h-4 w-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>

              </div>

              {/* Recent Meetings Placeholder List */}
              <div className="bg-slate-900/20 rounded-2xl border border-white/5 p-6 space-y-4">
                <h2 className="font-display font-bold text-sm text-slate-300 tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" /> Recent Meetings History
                </h2>

                <div className="divide-y divide-white/5">
                  {recentMeetings.map((meeting) => (
                    <div 
                      key={meeting.id} 
                      className="py-3.5 flex items-center justify-between text-xs hover:bg-white/1 flex-wrap gap-2 transition-all rounded-lg px-2"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200">{meeting.title}</p>
                        <p className="text-[10px] text-slate-500 font-light">
                          Room Code: <span className="font-mono text-slate-400">{meeting.roomId}</span> • Host: {meeting.host}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-slate-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" /> {meeting.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-slate-500" /> {meeting.duration}
                        </span>
                        
                        <button
                          onClick={() => {
                            setRoomId(meeting.roomId);
                            setMeetingTitle(meeting.title);
                            navigate(`/meeting/${meeting.roomId}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Rejoin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error messages overlay */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

            </div>

            {/* Right Workspace Panel: User Profile Card & Stats */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* User Profile Overview Card */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] brand-gradient" />
                
                <h3 className="font-display font-bold text-sm text-slate-300 tracking-wide mb-5 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-indigo-400" /> Member Account
                </h3>

                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <img
                    src={user?.avatarUrl}
                    alt={user?.name}
                    className="h-20 w-20 rounded-full ring-4 ring-indigo-500/20 object-cover"
                  />

                  {/* Profile info details */}
                  <div className="space-y-1">
                    <h4 className="font-display font-extrabold text-base text-slate-200">
                      {user?.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-light">{user?.email}</p>
                  </div>

                  <div className="w-full pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 font-light uppercase tracking-wider block">Meetings run</span>
                      <span className="font-display font-bold text-slate-200 text-sm mt-1 block">8 calls</span>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 font-light uppercase tracking-wider block">Total Hours</span>
                      <span className="font-display font-bold text-slate-200 text-sm mt-1 block">4.5 hrs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Spec Banner Callout (Phase 1 Info) */}
              <div className="bg-indigo-500/5 rounded-2xl border border-indigo-500/10 p-5 space-y-2">
                <span className="inline-flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                  Tech Spec
                </span>
                <h4 className="font-display font-bold text-xs text-slate-300">Phase 1 Auth Complete</h4>
                <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                  Sessions are validated using stateless JSON Web Tokens. Submitting new/join events validates room coordinates via custom API gateways.
                </p>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
};
export default Home;
