import React from 'react';
import { 
  Shield, 
  Navigation, 
  Package, 
  AlertTriangle, 
  Crosshair, 
  Sun, 
  Moon, 
  Info, 
  User as UserIcon, 
  LogOut,
  Bookmark
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarRailProps {
  activeTab: 'planner' | 'reports' | 'saved';
  setActiveTab: (tab: 'planner' | 'reports' | 'saved') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCalibrationModal: () => void;
  onOpenMethodology: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  savedRoutesCount: number;
  isCalibrated: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onOpenCalibrationModal,
  onOpenMethodology,
  currentUser,
  onOpenAuth,
  onLogout,
  savedRoutesCount,
  isCalibrated
}) => {
  return (
    <aside 
      className={`w-16 h-full shrink-0 flex flex-col items-center py-4 justify-between z-30 transition-colors duration-200 courier-rail ${
        theme === 'light' 
          ? 'bg-white border-r border-slate-200 text-slate-700' 
          : 'bg-[#090d16]/95 border-r border-slate-800/80 text-slate-300'
      }`}
    >
      {/* Top Section: App Logo & Navigation Icons */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Logo Shield */}
        <button
          onClick={() => setActiveTab('planner')}
          className="w-10 h-10 rounded-full bg-slate-950 text-lime-400 dark:bg-lime-400 dark:text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          title="SafeRoute AI"
        >
          <Shield className="w-5 h-5 fill-current" />
        </button>

        {/* Action / View Icons */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {/* Routes / Explorer (Active) */}
          <button
            onClick={() => setActiveTab('planner')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'planner'
                ? theme === 'light'
                  ? 'bg-slate-900 text-white shadow-md font-bold'
                  : 'bg-lime-400/20 text-lime-300 border border-lime-400/40 shadow-[0_0_15px_rgba(163,230,53,0.2)]'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Safe Route Corridors"
          >
            <Package className="w-5 h-5" />
          </button>

          {/* Saved Routes */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all ${
              activeTab === 'saved'
                ? theme === 'light'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-lime-400/20 text-lime-300 border border-lime-400/40'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Saved Routes"
          >
            <Bookmark className="w-5 h-5" />
            {savedRoutesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-lime-500 shadow-sm"></span>
            )}
          </button>

          {/* Hazard Reports & Intel */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'reports'
                ? theme === 'light'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Community Hazard Radar"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>

          {/* GPS Pinpoint Calibration */}
          <button
            onClick={onOpenCalibrationModal}
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all ${
              isCalibrated
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={isCalibrated ? "Location Calibrated (Click to adjust)" : "Pinpoint GPS Calibration"}
          >
            <Crosshair className="w-5 h-5" />
            {isCalibrated && (
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Section: Theme Switcher, Methodology & Profile */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-sm'
              : 'text-cyan-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700'
          }`}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Methodology Info */}
        <button
          onClick={onOpenMethodology}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Safety Scoring Methodology"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* User Auth / Profile */}
        {currentUser ? (
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center transition-all"
            title={`Sign out (${currentUser.displayName || currentUser.email})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Sign In / Register"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
