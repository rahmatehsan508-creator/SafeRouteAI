import React from 'react';
import { ShieldCheck, X, Lightbulb, Users, Building, Activity, HeartPulse, Clock, AlertTriangle } from 'lucide-react';

interface SafetyMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyMethodologyModal: React.FC<SafetyMethodologyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-4 max-h-[85vh] overflow-y-auto border border-white/15 relative">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">Safety Scoring Methodology</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-light">How SafeRoute AI computes estimated safety scores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Important Notice */}
        <div className="glass-card bg-amber-500/15 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Important Notice: Estimated Scores, Not Guarantees</span>
          </div>
          <p className="leading-relaxed font-light opacity-95">
            SafeRoute AI always expresses safety as an <strong className="font-semibold text-amber-950 dark:text-amber-200">estimated Safety Score out of 100</strong> (e.g., &quot;Safety Score: 88/100&quot;). We never display &quot;91% safe&quot; or claim absolute immunity from hazard. Always exercise personal situational awareness and sound judgment.
          </p>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Primary Safety Factors Evaluated
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Street Illumination (25%)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Consistency of streetlighting infrastructure along arterial and secondary streets, critical during dusk and nighttime travel.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Public Presence (22%)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Active commercial density, transit hubs, and pedestrian activity that provide continuous ambient visibility and informal surveillance.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-800 dark:text-indigo-300">
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Low Isolation Rating (20%)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Proximity to occupied establishments, open businesses, and populated corridors versus secluded alleyways or deserted industrial zones.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Infrastructure Condition (15%)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Sidewalk quality, dedicated cycling lane presence, road paving, crosswalk availability, and absence of physical hazards.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Emergency Accessibility (10%)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Proximity to emergency care centers, hospitals, fire stations, and civic help booths along the corridor.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-300">
                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Temporal & Community Adjustments</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-light">
                Time-of-day multipliers account for reduced night visibility. Active community hazard reports within 450m dynamically adjust score.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-200 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-emerald-400/30 hover:scale-105 active:scale-95"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
