import React from 'react';
import { RouteOption, GpsLocation } from '../types';
import { Navigation, Shield, Zap, Radio } from 'lucide-react';

interface FloatingBottomDockProps {
  route: RouteOption | null;
  sourceText: string;
  destText: string;
  currentGpsLocation: GpsLocation | null;
  isCalibrated: boolean;
  onStartNavigation: () => void;
  theme: 'light' | 'dark';
  onOpenCalibrationModal: () => void;
}

export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  route,
  sourceText,
  destText,
  currentGpsLocation,
  isCalibrated,
  onStartNavigation,
  theme,
}) => {
  if (!route) return null;

  const isSafest = route.safetyScore >= 80;

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-3xl z-20 pointer-events-auto">
      <div className={`p-3 sm:p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
          : 'bg-slate-950/92 border-slate-800/80 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
      }`}>
        {/* Left: Route Identity & GPS Origin/Dest */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            isSafest ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'
          }`}>
            {isSafest ? <Shield className="w-5 h-5 fill-current" /> : <Zap className="w-5 h-5 fill-current" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {isSafest ? 'SAFEST ROUTE' : 'FASTEST ROUTE'}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-400 truncate">
                {route.name}
              </span>
            </div>
            <div className="text-xs font-extrabold truncate max-w-[200px] sm:max-w-[240px] flex items-center gap-1 mt-0.5 text-slate-800 dark:text-slate-100">
              <span className="text-emerald-500 font-black text-[10px] shrink-0">GPS</span>
              <span className="truncate">{sourceText || route.name.split('via')[0] || 'Current Location'}</span>
              <span className="text-slate-400 shrink-0">→</span>
              <span className="text-cyan-400 font-black text-[10px] shrink-0">DEST</span>
              <span className="truncate">{destText || 'Destination'}</span>
            </div>
          </div>
        </div>

        {/* Center: Telemetry (Distance, Duration, Safety Score, GPS) */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs border-t sm:border-t-0 sm:border-l sm:border-r border-slate-200/80 dark:border-slate-800 pt-2.5 sm:pt-0 sm:px-4">
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Time & Dist</div>
            <div className="font-extrabold whitespace-nowrap text-slate-800 dark:text-slate-100">
              {route.durationFormatted} &bull; <span className="text-slate-400 font-normal">{route.distanceKm} km</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Safety Score</div>
            <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
              <span>{route.safetyScore}/100</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Live GPS</div>
            <div className="font-bold text-cyan-500 dark:text-cyan-400 flex items-center gap-1 text-[11px]">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              <span>{isCalibrated ? 'Calibrated' : currentGpsLocation ? 'Active' : 'Detected'}</span>
            </div>
          </div>
        </div>

        {/* Right: Start Navigation CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onStartNavigation}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              theme === 'light'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
            }`}
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Start Navigation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
