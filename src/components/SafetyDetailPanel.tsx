import React, { useState } from 'react';
import { RouteAIExplanation, RouteOption, RoutePreference, TravelMode } from '../types';
import { 
  ShieldCheck, 
  Lightbulb, 
  Users, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Bookmark, 
  RotateCw, 
  Activity, 
  HelpCircle,
  Building,
  HeartPulse,
  Navigation,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldAlert
} from 'lucide-react';

interface SafetyDetailPanelProps {
  route: RouteOption;
  travelMode: TravelMode;
  preference: RoutePreference;
  aiExplanation: RouteAIExplanation | null;
  isAiLoading: boolean;
  onRefreshAi: () => void;
  onSaveRoute: () => void;
  isRouteSaved: boolean;
  onOpenMethodology: () => void;
  onStartNavigation: () => void;
}

export const SafetyDetailPanel: React.FC<SafetyDetailPanelProps> = ({
  route,
  travelMode,
  preference,
  aiExplanation,
  isAiLoading,
  onRefreshAi,
  onSaveRoute,
  isRouteSaved,
  onOpenMethodology,
  onStartNavigation
}) => {
  const [showSteps, setShowSteps] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'bars'>('cards');
  const { safetyScore, safetyFactors, keyPositives, keyConcerns, steps } = route;

  // Score badge color
  let scoreTheme = {
    badge: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    text: 'text-cyan-400',
    ring: '#06b6d4',
    status: 'Optimal Safe Path'
  };

  if (safetyScore < 65) {
    scoreTheme = {
      badge: 'text-rose-300 bg-rose-500/15 border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      text: 'text-rose-400',
      ring: '#f43f5e',
      status: 'Caution Advised'
    };
  } else if (safetyScore < 80) {
    scoreTheme = {
      badge: 'text-amber-300 bg-amber-500/15 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      text: 'text-amber-400',
      ring: '#f59e0b',
      status: 'Moderate Safety'
    };
  }

  const getFactorStatus = (val: number) => {
    if (val >= 85) return { label: 'Optimal', color: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30' };
    if (val >= 70) return { label: 'Reliable', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' };
    if (val >= 55) return { label: 'Moderate', color: 'text-amber-300 bg-amber-500/15 border-amber-400/30' };
    return { label: 'Low', color: 'text-rose-300 bg-rose-500/15 border-rose-400/30' };
  };

  const factorItems = [
    {
      id: 'lighting',
      label: 'Street Illumination',
      weight: '25% weight',
      value: safetyFactors.lighting,
      icon: Lightbulb,
      accentColor: '#f59e0b', // Solar Amber
      gradient: 'from-amber-500 to-yellow-300',
      description: 'Luminance & nighttime visibility'
    },
    {
      id: 'publicPresence',
      label: 'Public Density',
      weight: '22% weight',
      value: safetyFactors.publicPresence,
      icon: Users,
      accentColor: '#06b6d4', // Electric Cyan
      gradient: 'from-cyan-500 to-sky-300',
      description: 'Commercial & pedestrian activity'
    },
    {
      id: 'isolation',
      label: 'Low Isolation',
      weight: '20% weight',
      value: safetyFactors.isolation,
      icon: Building,
      accentColor: '#818cf8', // Electric Indigo
      gradient: 'from-indigo-500 to-purple-300',
      description: 'Proximity to open storefronts & transit'
    },
    {
      id: 'roadCondition',
      label: 'Pathway Quality',
      weight: '15% weight',
      value: safetyFactors.roadCondition,
      icon: Activity,
      accentColor: '#10b981', // Mint Aqua
      gradient: 'from-emerald-500 to-teal-300',
      description: 'Sidewalk integrity & cycle lanes'
    },
    {
      id: 'emergencyAccessibility',
      label: 'Emergency Access',
      weight: '10% weight',
      value: safetyFactors.emergencyAccessibility,
      icon: HeartPulse,
      accentColor: '#f43f5e', // Neon Coral
      gradient: 'from-rose-500 to-pink-300',
      description: 'Proximity to hospitals & clinics'
    },
    {
      id: 'incidentRisk',
      label: 'Safety History Index',
      weight: '8% weight',
      value: safetyFactors.incidentRisk,
      icon: ShieldCheck,
      accentColor: '#38bdf8', // Neon Sky
      gradient: 'from-sky-500 to-cyan-300',
      description: 'Absence of hazard & incident reports'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Decorative ambient lighting */}
      <div className="absolute -top-24 -left-24 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Score Banner + Save Route Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 font-bold">Selected Path:</span>
            <span className="text-sm font-bold text-slate-100 truncate drop-shadow-sm">{route.name}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-light">
            {route.distanceKm} km &bull; {route.durationFormatted} &bull; Mode: <span className="capitalize text-slate-300 font-medium">{travelMode.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={onSaveRoute}
            disabled={isRouteSaved}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all duration-200 backdrop-blur-md ${
              isRouteSaved
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 cursor-default shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'glass-card border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-white shadow-sm'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isRouteSaved ? 'text-cyan-400 fill-cyan-400' : 'text-slate-400'}`} />
            <span>{isRouteSaved ? 'Saved' : 'Save Route'}</span>
          </button>

          {/* Primary Safety Score Display */}
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl ${scoreTheme.badge}`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div className="text-right">
              <div className="text-xs font-black tracking-tight">
                Safety Score: <span className="font-mono text-sm">{safetyScore}</span>/100
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-90 -mt-0.5 font-mono font-semibold">
                {scoreTheme.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action: Start Navigation on this specific route */}
      <div className="relative z-10">
        <button
          onClick={onStartNavigation}
          className="w-full bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:via-sky-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.35)] border border-cyan-400/40 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
        >
          <Navigation className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">Start Live Navigation ({route.name})</span>
        </button>
      </div>

      {/* Turn-by-Turn Maneuvers Preview */}
      {steps && steps.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden border border-white/[0.08] relative z-10">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.04] flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Turn-by-Turn Maneuvers ({steps.length} steps)</span>
            </span>
            {showSteps ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showSteps && (
            <div className="max-h-48 overflow-y-auto px-3.5 py-2.5 border-t border-white/[0.08] space-y-1.5 bg-slate-950/60 font-light">
              {steps.map((step, idx) => (
                <div key={idx} className="text-[11px] text-slate-300 flex items-start justify-between gap-2 py-0.5">
                  <span className="leading-snug">
                    <span className="text-cyan-400 font-mono mr-1.5 font-bold">{idx + 1}.</span>
                    {step.instruction}
                  </span>
                  {step.distanceMeters > 0 && (
                    <span className="text-cyan-300 font-mono text-[10px] shrink-0 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                      {step.distanceMeters < 1000 ? `${step.distanceMeters}m` : `${(step.distanceMeters / 1000).toFixed(1)}km`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Multi-Factor Visual Breakdown Section */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Safety Factor Breakdown (Points out of 100)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'bars' : 'cards')}
              className="text-[10px] px-2 py-0.5 rounded-lg border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all"
            >
              {viewMode === 'cards' ? 'List View' : 'Card View'}
            </button>
            <button
              onClick={onOpenMethodology}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium transition-colors"
            >
              Scoring Details &rarr;
            </button>
          </div>
        </div>

        {/* Overall Composite Score Bar */}
        <div className="glass-panel-elevated p-3.5 rounded-2xl border border-cyan-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-xs font-bold text-slate-200">Overall Route Safety Index</span>
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                {safetyScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
              <span className="text-[10px] text-slate-500 ml-1">pts</span>
            </div>
          </div>

          {/* Master Visual Progress Gauge */}
          <div className="space-y-1">
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-500"
                style={{ width: `${safetyScore}%` }}
              />
              {/* Target Marker Ticks */}
              <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/20" title="25 pts" />
              <div className="absolute top-0 bottom-0 left-2/4 w-[1px] bg-white/30" title="50 pts" />
              <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-white/20" title="75 pts" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
              <span>0 (High Risk)</span>
              <span>25</span>
              <span>50 (Moderate)</span>
              <span>75</span>
              <span className="text-cyan-400 font-bold">100 (Max Safety)</span>
            </div>
          </div>
        </div>

        {/* 6 Factor Score Visual Breakdown */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
            {factorItems.map((factor) => {
              const Icon = factor.icon;
              const status = getFactorStatus(factor.value);
              // Calculate SVG circular arc values
              const radius = 18;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (factor.value / 100) * circumference;

              return (
                <div
                  key={factor.id}
                  className="glass-card p-4 rounded-2xl border border-white/[0.08] hover:border-cyan-500/40 space-y-3 relative group transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Card Header: Icon + Title + Weight */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
                        style={{
                          backgroundColor: `${factor.accentColor}18`,
                          borderColor: `${factor.accentColor}40`,
                          color: factor.accentColor
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-200 transition-colors">
                          {factor.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {factor.weight}
                        </div>
                      </div>
                    </div>

                    {/* Radial Mini-Gauge SVG */}
                    <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                      <svg className="w-11 h-11 transform -rotate-90">
                        <circle
                          cx="22"
                          cy="22"
                          r={radius}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r={radius}
                          stroke={factor.accentColor}
                          strokeWidth="3.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          style={{
                            filter: `drop-shadow(0 0 4px ${factor.accentColor}80)`,
                            transition: 'stroke-dashoffset 0.6s ease-in-out'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[10px] text-slate-100">
                        {factor.value}
                      </div>
                    </div>
                  </div>

                  {/* Points out of 100 Visual Callout & Qualitative Tag */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black font-mono text-white">
                        {factor.value}
                      </span>
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        / 100
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">pts</span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-mono border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Visual 5-Block Segmented LED Gauge */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        const threshold = segment * 20;
                        const isFilled = factor.value >= threshold - 10;
                        return (
                          <div
                            key={segment}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isFilled
                                ? 'shadow-[0_0_6px_currentColor]'
                                : 'bg-white/[0.06]'
                            }`}
                            style={{
                              backgroundColor: isFilled ? factor.accentColor : undefined,
                              color: factor.accentColor
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-light leading-snug">
                      {factor.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Alternate Detailed Horizontal Bars View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {factorItems.map((factor) => {
              const Icon = factor.icon;
              const status = getFactorStatus(factor.value);
              return (
                <div key={factor.id} className="glass-card p-3.5 rounded-xl border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-200">{factor.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({factor.weight})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono border ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="font-mono">
                        <span className="text-sm font-extrabold text-white">{factor.value}</span>
                        <span className="text-xs font-bold text-cyan-400"> / 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${factor.gradient} shadow-sm transition-all duration-500`}
                      style={{ width: `${factor.value}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-light">
                    {factor.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer Note */}
      <div className="glass-card rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-400 border border-white/[0.06] relative z-10">
        <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-snug font-light">
          Safety is calculated as an <strong className="text-slate-200 font-semibold">estimated Safety Score out of 100</strong> synthesized from urban lighting infrastructure, real-time footfall density, road condition indexes, emergency proximity, and community hazard feeds. It is an advisory model and does not represent an absolute guarantee of personal safety.
        </p>
      </div>

      {/* Positive Highlights & Concerns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {/* Positives */}
        <div className="glass-card bg-cyan-950/25 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Safety Advantages</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-200 font-light">
            {keyPositives.map((pos, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5 font-bold">&bull;</span>
                <span>{pos}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div className="glass-card bg-amber-950/25 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Advisories & Considerations</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-200 font-light">
            {keyConcerns.map((con, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5 font-bold">&bull;</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gemini AI Reasoning Layer */}
      <div className="glass-panel-elevated bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-indigo-950/40 border border-indigo-400/30 rounded-2xl p-4 sm:p-5 space-y-3 relative z-10 shadow-[0_0_25px_rgba(99,102,241,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                Gemini Safety Assessment
              </span>
              <span className="text-[10px] text-indigo-300 block font-mono">
                {aiExplanation?.isAiGenerated ? 'Structured Gemini Analysis' : 'Deterministic Safety Model'}
              </span>
            </div>
          </div>

          <button
            onClick={onRefreshAi}
            disabled={isAiLoading}
            title="Refresh AI analysis"
            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-400/30 rounded-xl transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {isAiLoading ? (
          <div className="py-4 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[11px] text-slate-400 font-light">Evaluating multi-modal safety factors and corridor telemetry...</p>
          </div>
        ) : aiExplanation ? (
          <div className="space-y-2.5 text-xs text-slate-300">
            <p className="leading-relaxed text-slate-200 font-light">
              {aiExplanation.summary}
            </p>

            {aiExplanation.timeContext && (
              <div className="text-[11px] text-indigo-200 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 font-light">
                <strong className="text-indigo-300 font-semibold">Temporal Context:</strong> {aiExplanation.timeContext}
              </div>
            )}

            {aiExplanation.recommendations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Key Route Insights:</span>
                <ul className="space-y-1 text-[11px] text-slate-200 font-light">
                  {aiExplanation.recommendations.map((rec, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold">&bull;</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
