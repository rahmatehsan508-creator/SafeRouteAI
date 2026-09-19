import React, { useState } from 'react';
import { CommunityReport, ReportCategory } from '../types';
import { AlertTriangle, ThumbsUp, MapPin, Filter, Plus, ShieldCheck, CheckCircle2, Camera, X, Maximize2 } from 'lucide-react';

interface CommunityFeedViewProps {
  reports: CommunityReport[];
  onConfirmReport: (id: string) => void;
  onOpenSubmitModal: () => void;
  onFocusReportOnMap: (report: CommunityReport) => void;
}

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({
  reports,
  onConfirmReport,
  onOpenSubmitModal,
  onFocusReportOnMap
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const filteredReports = selectedCategory === 'all'
    ? reports
    : reports.filter(r => r.category === selectedCategory);

  const categories: string[] = [
    'all',
    'Poor Lighting',
    'Road Damage',
    'Reported Incident',
    'Isolated Area',
    'Heavy Crowd',
    'Other'
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-4 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">Urban Community Safety Intel</h2>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 max-w-xl font-light">
            Real-time, peer-verified ground reports detailing street lighting, road surface damage, and isolated segments. Every report informs nearby route safety scoring.
          </p>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/40 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Safety Hazard</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 ml-1 mr-0.5" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 backdrop-blur-md ${
              selectedCategory === cat
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold'
                : 'glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06]'
            }`}
          >
            {cat === 'all' ? 'All Intel' : cat}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-600 dark:text-slate-400 glass-card rounded-2xl border border-slate-200 dark:border-white/[0.06]">
            No community reports in this category.
          </div>
        ) : (
          filteredReports.map((rep) => {
            const formattedDate = new Date(rep.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            let statusBadge = 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            if (rep.status === 'Verified') statusBadge = 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            else if (rep.status === 'Community Confirmed') statusBadge = 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]';

            return (
              <div
                key={rep.id}
                className="glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all duration-200 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">{rep.category}</span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-light">
                      <span>Reported by {rep.userName || 'Community User'}</span>
                      <span>&bull;</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-lg border backdrop-blur-md ${statusBadge}`}>
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/[0.04] font-light">
                  {rep.description}
                </p>

                {/* Attached Photo Evidence Preview */}
                {rep.photoUrl && (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900/50">
                    <img
                      src={rep.photoUrl}
                      alt={`Ground photo for ${rep.category}`}
                      className="w-full h-40 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setActivePhotoUrl(rep.photoUrl!)}
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[10px] font-mono text-white flex items-center gap-1 pointer-events-none">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Photo Evidence</span>
                    </div>
                    <button
                      onClick={() => setActivePhotoUrl(rep.photoUrl!)}
                      className="absolute bottom-2 right-2 bg-emerald-600/90 hover:bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand Photo</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => onFocusReportOnMap(rep)}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View Location on Map</span>
                  </button>

                  <button
                    onClick={() => onConfirmReport(rep.id)}
                    className="bg-slate-100 dark:bg-white/[0.05] hover:bg-emerald-50 dark:hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-sm"
                    title="Confirm this report condition"
                  >
                    <ThumbsUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Confirm ({rep.confirmations})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PHOTO LIGHTBOX MODAL */}
      {activePhotoUrl && (
        <div
          className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePhotoUrl}
              alt="Full size community report photo evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <div className="mt-3 text-xs text-slate-300 font-mono bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Ground Photo Evidence &bull; Peer Verified Field Upload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
