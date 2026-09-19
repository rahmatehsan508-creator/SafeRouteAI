import React from 'react';
import { ShieldCheck, Lightbulb, Users, Building, Activity, HeartPulse, Sparkles, Navigation, AlertTriangle, ArrowRight } from 'lucide-react';
import { CommunityReport } from '../types';

interface SafetyOverviewCardProps {
  reports: CommunityReport[];
  onSelectQuickRoute: (source: string, destination: string) => void;
  onOpenMethodology: () => void;
}

export const SafetyOverviewCard: React.FC<SafetyOverviewCardProps> = ({
  reports,
  onSelectQuickRoute,
  onOpenMethodology
}) => {
  const verifiedHazardsCount = reports.filter(r => r.confirmations > 0).length;

  const telemetryFactors = [
    {
      title: 'Lighting & Visibility',
      weight: '25%',
      desc: 'Real-time urban lamp post distribution and dark alleyway avoidance',
      icon: Lightbulb,
      color: '#f59e0b',
      border: 'hover:border-amber-500/40'
    },
    {
      title: 'Pedestrian Density',
      weight: '22%',
      desc: 'Active commercial storefronts, footfall velocity, and transit hubs',
      icon: Users,
      color: '#06b6d4',
      border: 'hover:border-cyan-500/40'
    },
    {
      title: 'Low Isolation Index',
      weight: '20%',
      desc: 'Minimizes unmonitored bypasses, vacant lots, and secluded lanes',
      icon: Building,
      color: '#818cf8',
      border: 'hover:border-indigo-500/40'
    },
    {
      title: 'Pathway Infrastructure',
      weight: '15%',
      desc: 'Continuous pedestrian sidewalks, bike lane buffers, and road quality',
      icon: Activity,
      color: '#10b981',
      border: 'hover:border-emerald-500/40'
    },
    {
      title: 'Emergency Proximity',
      weight: '10%',
      desc: 'Direct accessibility to hospitals, 24/7 pharmacies, and police stations',
      icon: HeartPulse,
      color: '#f43f5e',
      border: 'hover:border-rose-500/40'
    },
    {
      title: 'Incident Telemetry',
      weight: '8%',
      desc: 'Historical incident records and verified community hazard alerts',
      icon: ShieldCheck,
      color: '#38bdf8',
      border: 'hover:border-sky-500/40'
    }
  ];

  const popularCorridors = [
    {
      name: 'South Kolkata Heritage Corridor',
      source: 'Victoria Memorial, Kolkata',
      destination: 'Howrah Railway Station',
      desc: 'Well-lit arterial corridor with continuous public transport presence'
    },
    {
      name: 'Cultural & Academic Route',
      source: 'Park Street, Kolkata',
      destination: 'College Street, Kolkata',
      desc: 'High footfall density, open commercial storefronts, and emergency access'
    },
    {
      name: 'Salt Lake Tech Safe Path',
      source: 'Salt Lake Sector V, Kolkata',
      destination: 'New Town Eco Park, Kolkata',
      desc: 'Wide pedestrian sidewalks, monitored cycling lanes, and street lighting'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner: Status & Quick Metric Bar */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-cyan-400">
                SafeRoute Intelligence System Ready
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Multi-Factor Safety Routing & Telemetry Engine
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-light max-w-2xl">
              Enter an origin and destination in the Route Planner on the left, or pick a verified corridor below to analyze routes rated across 6 safety metrics with scores out of 100.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Active Hazard Feeds</div>
              <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{reports.length} Reports</span>
              </div>
            </div>
            <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Community Verified</div>
              <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 font-mono flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{verifiedHazardsCount} Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Multi-Factor Metric Cards Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              6 Core Safety Evaluation Factors (100-Point Model)
            </span>
          </div>
          <button
            onClick={onOpenMethodology}
            className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline font-mono"
          >
            Read Methodology &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {telemetryFactors.map((factor, idx) => {
            const Icon = factor.icon;
            return (
              <div
                key={idx}
                className={`glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] ${factor.border} transition-all duration-200 space-y-2 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
                      style={{
                        backgroundColor: `${factor.color}15`,
                        borderColor: `${factor.color}40`,
                        color: factor.color
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                      {factor.weight}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{factor.title}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-light mt-1 leading-snug">
                    {factor.desc}
                  </p>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: factor.color, width: '100%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Corridors Quick-Select */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              Quick Test Corridors
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Click to evaluate safety in 1 click</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {popularCorridors.map((corridor, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuickRoute(corridor.source, corridor.destination)}
              className="glass-card hover:bg-slate-50 dark:hover:bg-[#0c152d]/90 p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-cyan-500/50 dark:hover:border-cyan-400/40 text-left transition-all duration-200 group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    {corridor.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-light leading-snug mb-2">
                  {corridor.desc}
                </p>
              </div>

              <div className="text-[10px] font-mono text-cyan-400/90 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 truncate">
                {corridor.source.split(',')[0]} &rarr; {corridor.destination.split(',')[0]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
