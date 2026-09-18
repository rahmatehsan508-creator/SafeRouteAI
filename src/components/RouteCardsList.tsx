import React from 'react';
import { RouteOption } from '../types';
import { ShieldCheck, Clock, Navigation, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface RouteCardsListProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

export const RouteCardsList: React.FC<RouteCardsListProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute
}) => {
  if (routes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
        <Navigation className="w-8 h-8 mx-auto mb-2 text-cyan-400/60" />
        <p className="text-xs">No routes calculated yet. Enter an origin and destination to compare safe paths.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
          Evaluated Route Options ({routes.length})
        </span>
        <span className="text-[10px] text-cyan-400/80 font-mono">
          Ranked by your safety preference
        </span>
      </div>

      <div className="space-y-2.5">
        {routes.map((route, idx) => {
          const isSelected = route.id === selectedRouteId;
          const isRecommended = route.isRecommendedForPreference || idx === 0;

          // Score color badge
          let scoreTheme = {
            badge: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
            bar: 'bg-gradient-to-r from-cyan-500 to-sky-400',
            glow: 'rgba(6,182,212,0.25)'
          };

          if (route.safetyScore < 65) {
            scoreTheme = {
              badge: 'text-rose-300 bg-rose-500/15 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
              bar: 'bg-gradient-to-r from-rose-500 to-pink-400',
              glow: 'rgba(244,63,94,0.25)'
            };
          } else if (route.safetyScore < 80) {
            scoreTheme = {
              badge: 'text-amber-300 bg-amber-500/15 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
              bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
              glow: 'rgba(245,158,11,0.25)'
            };
          }

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-[#0c152d]/90 backdrop-blur-2xl border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.01]'
                  : 'glass-card hover:bg-[#0d1733]/70 hover:border-cyan-400/30'
              }`}
            >
              {/* Header: Preference Tag + Name */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {route.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
                  )}
                </div>

                {isRecommended && (
                  <span className="bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {route.preferenceFit || 'Best Match'}
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08] font-mono">
                    {route.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08] font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{route.durationFormatted}</span>
                  </span>
                </div>

                {/* Explicit Safety Score Display Requirement */}
                <div className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 backdrop-blur-md ${scoreTheme.badge}`}>
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono">
                    Score: <strong className="text-white text-sm">{route.safetyScore}</strong>/100
                  </span>
                </div>
              </div>

              {/* Mini Visual Score Progress Bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 mb-2.5">
                <div
                  className={`h-full rounded-full ${scoreTheme.bar} shadow-sm`}
                  style={{ width: `${route.safetyScore}%` }}
                />
              </div>

              {/* Key Factors Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06] text-[11px]">
                {route.keyPositives.slice(0, 2).map((pos, pIdx) => (
                  <span key={pIdx} className="text-cyan-300/90 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 font-light">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{pos}</span>
                  </span>
                ))}
                {route.keyConcerns.slice(0, 1).map((con, cIdx) => (
                  <span key={cIdx} className="text-amber-300/90 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-light">
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{con}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
