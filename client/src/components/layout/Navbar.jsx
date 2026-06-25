import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, LogOut, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-white/5 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-lg group-hover:scale-105 transition-all">
                <Video className="h-5.5 w-5.5" />
              </div>
              <span className="font-display font-bold text-lg tracking-wider text-gradient">
                OPTIMAS <span className="font-light text-slate-400">MEET</span>
              </span>
            </Link>
          </div>

          {/* User Profile / Status */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                {/* User Info Card */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-300 font-display">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-light">{user.email}</span>
                </div>
                
                {/* User Avatar */}
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-9 w-9 rounded-full ring-2 ring-indigo-500/30 object-cover"
                />

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-900 border border-white/5 text-slate-400">
                  <ShieldAlert className="h-3 w-3" /> Secure Access
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
