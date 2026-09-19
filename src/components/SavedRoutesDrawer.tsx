import React from 'react';
import { SavedRoute } from '../types';
import { Bookmark, X, ArrowRight, Trash2, Navigation, ShieldCheck } from 'lucide-react';

interface SavedRoutesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutes: SavedRoute[];
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (id: string) => void;
}

export const SavedRoutesDrawer: React.FC<SavedRoutesDrawerProps> = ({
  isOpen,
  onClose,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex justify-end animate-fade-in">
      <div className="w-full max-w-md glass-panel-elevated h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l border-white/15">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Bookmark className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">Saved Safe Routes</h2>
            <span className="bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              {savedRoutes.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {savedRoutes.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Bookmark className="w-7 h-7" />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-200">No Saved Routes Yet</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed font-light">
                When you calculate routes in the Route Planner, click &quot;Save Route&quot; on any selected path to bookmark it here.
              </p>
            </div>
          ) : (
            savedRoutes.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all duration-200 shadow-lg"
                >
                  {/* Origin & Destination */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></span>
                        <span className="truncate max-w-[240px] drop-shadow-sm">{item.source}</span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0"></span>
                        <span className="truncate max-w-[240px] drop-shadow-sm">{item.destination}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteRoute(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-400/30"
                      title="Delete saved route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2 font-light">
                      <span className="capitalize text-slate-800 dark:text-slate-300">{item.travelMode.replace('_', ' ')}</span>
                      <span>&bull;</span>
                      <span>{item.distance}</span>
                      <span>&bull;</span>
                      <span>{item.duration}</span>
                    </div>

                    <div className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.safetyScore}/100</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">{formattedDate}</span>
                    <button
                      onClick={() => {
                        onLoadRoute(item);
                        onClose();
                      }}
                      className="bg-emerald-600/15 hover:bg-emerald-600/25 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Load on Map</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
