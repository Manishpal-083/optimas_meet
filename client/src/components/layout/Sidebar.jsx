import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Video, History, 
  Settings, LogOut, BarChart3, HelpCircle 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '#history', icon: History, badge: 'Mock' },
    { name: 'Analytics', path: '#analytics', icon: BarChart3, badge: 'Boiler' },
    { name: 'Settings', path: '#settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass border-r border-white/5 flex flex-col hidden md:flex shrink-0">
      
      {/* 1. Sidebar Brand/Info Panel */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
          <img
            src={user?.avatarUrl}
            alt={user?.name}
            className="h-10 w-10 rounded-lg ring-2 ring-indigo-500/20 object-cover"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-200 font-display truncate">
              {user?.name || 'User Profile'}
            </span>
            <span className="text-[10px] text-slate-500 truncate">
              Authenticated
            </span>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-display font-medium tracking-wide transition-all group duration-200 ${
                isActive
                  ? 'brand-gradient text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent hover:border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}`} />
                <span>{item.name}</span>
              </div>
              
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-800 text-slate-500 border border-white/5'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer Actions (Support & Logout) */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link
          to="#support"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Support Desk</span>
        </Link>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all border border-transparent hover:border-rose-500/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};
export default Sidebar;
