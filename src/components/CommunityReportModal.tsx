import React, { useState } from 'react';
import { Coordinates, ReportCategory } from '../types';
import { AlertTriangle, X, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: {
    category: ReportCategory;
    description: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  initialCoords: Coordinates | null;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
  currentUser,
  onOpenAuth
}) => {
  const [category, setCategory] = useState<ReportCategory>('Poor Lighting');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<string>(initialCoords ? initialCoords.lat.toFixed(5) : '22.5448');
  const [lng, setLng] = useState<string>(initialCoords ? initialCoords.lng.toFixed(5) : '88.3426');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { id: ReportCategory; label: string; desc: string }[] = [
    { id: 'Poor Lighting', label: 'Poor Lighting', desc: 'Non-functional streetlights or dark corridor' },
    { id: 'Road Damage', label: 'Road Damage', desc: 'Potholes, open drains, or debris' },
    { id: 'Reported Incident', label: 'Reported Incident', desc: 'Harassment, theft, or physical threat' },
    { id: 'Isolated Area', label: 'Isolated Area', desc: 'Deserted stretch with no public presence' },
    { id: 'Heavy Crowd', label: 'Heavy Crowd', desc: 'Severe congestion or blocked pathway' },
    { id: 'Other', label: 'Other Hazard', desc: 'Any other safety or accessibility barrier' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrorMsg('Please specify valid latitude and longitude coordinates.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Please provide a brief description (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        description: description.trim(),
        latitude: parsedLat,
        longitude: parsedLng
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setDescription('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-4 border border-white/15 relative overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 drop-shadow-sm">Submit Safety Intel</h2>
              <p className="text-[10px] text-slate-400 font-light">Share ground-level conditions to keep others safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-2.5 relative z-10">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <div className="text-base font-bold text-slate-100">Report Successfully Submitted!</div>
            <p className="text-xs text-slate-300 font-light max-w-xs mx-auto">
              Status set to <strong className="text-amber-400 font-semibold">Reported</strong>. It is now visible on the safety map and actively factored into nearby route evaluations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {!currentUser && (
              <div className="glass-card bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-3 text-xs text-indigo-200 flex items-center justify-between gap-2 shadow-sm">
                <span>Submitting as Community Contributor.</span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="font-bold underline text-indigo-300 hover:text-white transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="glass-card bg-rose-500/15 border border-rose-400/40 rounded-xl p-3 text-xs text-rose-200 shadow-sm">
                {errorMsg}
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all duration-200 ${
                      category === cat.id
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'glass-card border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="text-xs">{cat.label}</div>
                    <div className="text-[10px] opacity-75 truncate font-light">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider font-mono">
                Description / Condition
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the issue (e.g. broken lamppost on west sidewalk, zero lighting past 9pm)..."
                className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all resize-none font-light"
              />
            </div>

            {/* Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Location Coordinates</span>
                </label>
                <span className="text-[10px] text-slate-400 font-light">Tip: Click map to pin</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                />
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Disclaimer on verification */}
            <div className="text-[10px] text-slate-400 leading-tight font-light">
              Note: Submissions start with <em>Reported</em> status until confirmed by community members or verified against official civic channels.
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.35)] border border-amber-400/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
