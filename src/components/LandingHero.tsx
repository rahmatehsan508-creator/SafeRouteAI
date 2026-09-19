import React from 'react';
import { Shield, ArrowRight, Eye, AlertCircle, Clock, MapPin, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  onStartPlanning: () => void;
  onQuickRouteSelect: (source: string, destination: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartPlanning,
  onQuickRouteSelect
}) => {
  return (
    <div className="py-8 px-4 lg:px-8 max-w-6xl mx-auto space-y-10 relative">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Banner & Value Proposition */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold backdrop-blur-xl shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Dynamic Urban Safety Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight drop-shadow-sm">
          Choose routes based on <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">more than speed</span>.
        </h1>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
          Traditional navigation prioritizes the fastest path, often leading you through poorly lit alleys or isolated corridors. SafeRoute AI evaluates real road lighting, public density, incident risks, and verified community reports.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStartPlanning}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.35)] border border-emerald-400/30 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group"
          >
            <span>Launch Route Planner</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Preset Fast-Launch Corridors */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sample Demonstration Corridors (Real Geocoding & Routing)</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-light">Click to instantly calculate live routes & safety scores</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => onQuickRouteSelect('Victoria Memorial, Kolkata', 'Howrah Station, Kolkata')}
            className="text-left p-3.5 rounded-xl glass-card hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 transition-all duration-200 group shadow-md"
          >
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-1 tracking-wider uppercase">Kolkata Urban Core</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              Victoria Memorial &rarr; Howrah Station
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-light">
              <span>Primary thoroughfare vs. historic riverbank alleys</span>
            </div>
          </button>

          <button
            onClick={() => onQuickRouteSelect('Park Street, Kolkata', 'Salt Lake Sector V, Kolkata')}
            className="text-left p-3.5 rounded-xl glass-card hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 transition-all duration-200 group shadow-md"
          >
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-1 tracking-wider uppercase">Tech Corridor Commute</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              Park Street &rarr; Salt Lake Sector V
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-light">
              <span>Flyover arterial vs. bypass secondary streets</span>
            </div>
          </button>

          <button
            onClick={() => onQuickRouteSelect('Times Square, New York', 'Central Park South, New York')}
            className="text-left p-3.5 rounded-xl glass-card hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 transition-all duration-200 group shadow-md"
          >
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-1 tracking-wider uppercase">Manhattan Midtown</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              Times Square &rarr; Central Park South
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-light">
              <span>7th Ave pedestrian hub vs. side avenues</span>
            </div>
          </button>
        </div>
      </div>

      {/* Core Safety Intelligence Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2.5 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-sm">
            <Eye className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Multi-Factor Safety Engine</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            Evaluates lighting infrastructure, public pedestrian density, street isolation, and emergency service proximity. Expressed as an estimated score out of 100.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2.5 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Community Safety Reports</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            Report road damage, dark stretches, or sudden hazards directly to Firestore. Community contributions dynamically adjust safety scores along matching corridors.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2.5 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shadow-sm">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Gemini Route Reasoning</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            Structured AI reasoning explains trade-offs between speed and safety. Understand why a 3-minute longer detour may be significantly better lit at night.
          </p>
        </div>
      </div>
    </div>
  );
};
