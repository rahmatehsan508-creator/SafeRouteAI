import React from 'react';
import { 
  Sun, 
  Moon, 
  AlertTriangle, 
  Crosshair, 
  Layers, 
  Search,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface FloatingMapHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenReportModal: () => void;
  onOpenCalibrationModal: () => void;
  isCalibrated: boolean;
  destinationName?: string;
  isNavigating?: boolean;
}

export const FloatingMapHeader: React.FC<FloatingMapHeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenReportModal,
  onOpenCalibrationModal,
  isCalibrated,
  destinationName,
  isNavigating
}) => {
  if (isNavigating) return null;

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
      {/* Left: Prominent Destination Title on Map if available */}
      <div className="pointer-events-auto">
        {destinationName && (
          <div className={`py-1.5 px-3.5 rounded-full border backdrop-blur-xl shadow-lg flex items-center gap-2 transition-all ${
            theme === 'light'
              ? 'bg-white/90 border-slate-200 text-slate-900 font-extrabold text-xs'
              : 'bg-slate-950/80 border-slate-800 text-white font-extrabold text-xs'
          }`}>
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            <span>📍 {destinationName}</span>
          </div>
        )}
      </div>

      {/* Right: Floating Controls */}
      <div className="flex items-center gap-2 pointer-events-auto ml-auto">
        {/* GPS Calibration Pill */}
        <button
          onClick={onOpenCalibrationModal}
          className={`py-1.5 px-3 rounded-full border backdrop-blur-xl shadow-md text-xs font-bold flex items-center gap-1.5 transition-all ${
            isCalibrated
              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-400/50'
              : theme === 'light'
                ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-white'
                : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
          title={isCalibrated ? "Calibrated to exact pinpoint" : "Calibrate GPS pinpoint"}
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline">{isCalibrated ? 'Calibrated' : 'Calibrate'}</span>
        </button>

        {/* Report Hazard Button */}
        <button
          onClick={onOpenReportModal}
          className="py-1.5 px-3.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 backdrop-blur-xl shadow-md text-xs font-bold flex items-center gap-1.5 transition-all"
          title="Report Hazard Incident"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Report Hazard</span>
        </button>

        {/* Theme Switcher Pill (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-full border backdrop-blur-xl shadow-md text-xs font-bold flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'bg-white/90 border-slate-200 text-amber-600 hover:bg-white'
              : 'bg-slate-900/90 border-slate-800 text-cyan-300 hover:bg-slate-800'
          }`}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
