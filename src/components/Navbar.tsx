import React from 'react';
import { User } from 'firebase/auth';
import { Shield, Navigation, MapPin, Bookmark, User as UserIcon, LogOut, Info, AlertTriangle, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'planner' | 'landing' | 'community';
  setActiveTab: (tab: 'planner' | 'landing' | 'community') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSavedRoutes: () => void;
  onOpenMethodology: () => void;
  onOpenReportModal: () => void;
  savedRoutesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenSavedRoutes,
  onOpenMethodology,
  onOpenReportModal,
  savedRoutesCount
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#050814]/80 backdrop-blur-2xl border-b border-cyan-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.6)] px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/30 group-hover:border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300">
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans drop-shadow-sm">
                SafeRoute<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">AI</span>
              </span>
              <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                ESTIMATE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide hidden sm:block font-light">
              Intelligent Urban Safety Routing
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-[#090e21]/70 backdrop-blur-md p-1 rounded-xl border border-white/[0.08] shadow-inner">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'planner'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Route Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'community'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Safety Intel</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Submit Report Button */}
          <button
            onClick={onOpenReportModal}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-200"
            title="Report a hazard or incident"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-semibold">Report Hazard</span>
          </button>

          {/* Saved Routes */}
          <button
            onClick={onOpenSavedRoutes}
            className="bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all relative shadow-sm"
            title="View saved routes"
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Saved</span>
            {savedRoutesCount > 0 && (
              <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                {savedRoutesCount}
              </span>
            )}
          </button>

          {/* Methodology Info */}
          <button
            onClick={onOpenMethodology}
            className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900/40 hover:bg-slate-800/60 border border-white/[0.06] hover:border-cyan-400/30 backdrop-blur-md rounded-xl transition-all"
            title="Safety Scoring Methodology"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-white/10">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Authenticated</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/40 hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 rounded-xl transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:border-cyan-400/70 backdrop-blur-md font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-1.5 transition-all duration-200"
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
