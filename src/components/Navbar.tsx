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
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#050814]/80 backdrop-blur-2xl border-b border-slate-200 dark:border-cyan-500/15 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.6)] px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-indigo-500/20 border border-cyan-500/30 dark:border-cyan-400/40 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:bg-cyan-500/20 dark:group-hover:bg-cyan-500/30 shadow-sm transition-all duration-300">
            <Shield className="w-5 h-5 text-cyan-700 dark:text-cyan-400 group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans drop-shadow-sm">
                SafeRoute<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-600 dark:from-cyan-400 dark:to-sky-300">AI</span>
              </span>
              <span className="bg-cyan-500/15 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shadow-sm">
                ESTIMATE
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 -mt-0.5 tracking-wide hidden sm:block font-light">
              Intelligent Urban Safety Routing
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-[#090e21]/70 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-inner">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'planner'
                ? 'bg-emerald-600/15 dark:bg-cyan-500/20 text-emerald-800 dark:text-cyan-200 border border-emerald-500/40 dark:border-cyan-400/40 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-700 dark:text-cyan-400" />
            <span>Route Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'community'
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 dark:border-amber-400/40 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Safety Intel</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Submit Report Button */}
          <button
            onClick={onOpenReportModal}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all duration-200"
            title="Report a hazard or incident"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden md:inline font-semibold">Report Hazard</span>
          </button>

          {/* Saved Routes */}
          <button
            onClick={onOpenSavedRoutes}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all relative shadow-sm"
            title="View saved routes"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-700 dark:text-cyan-400" />
            <span className="hidden sm:inline">Saved</span>
            {savedRoutesCount > 0 && (
              <span className="bg-emerald-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                {savedRoutesCount}
              </span>
            )}
          </button>

          {/* Methodology Info */}
          <button
            onClick={onOpenMethodology}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-cyan-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-white/[0.06] hover:border-emerald-500/30 dark:hover:border-cyan-400/30 backdrop-blur-md rounded-xl transition-all"
            title="Safety Scoring Methodology"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-white/10">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-cyan-400 font-mono">Authenticated</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-900/40 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/[0.06] hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-emerald-600/15 hover:bg-emerald-600/25 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-emerald-800 dark:text-cyan-200 border border-emerald-500/40 dark:border-cyan-400/40 hover:border-emerald-500/70 dark:hover:border-cyan-400/70 backdrop-blur-md font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all duration-200"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
