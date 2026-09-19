import React, { useState } from 'react';
import { Coordinates, ReportCategory } from '../types';
import { AlertTriangle, X, MapPin, CheckCircle, Loader2, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { uploadReportPhoto } from '../services/firebase';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: {
    category: ReportCategory;
    description: string;
    latitude: number;
    longitude: number;
    photoUrl?: string;
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
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreviewUrl(preview);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
  };

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
      let uploadedPhotoUrl: string | undefined = undefined;
      if (selectedPhotoFile) {
        uploadedPhotoUrl = await uploadReportPhoto(selectedPhotoFile, currentUser?.uid || 'guest');
      }

      await onSubmit({
        category,
        description: description.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        photoUrl: uploadedPhotoUrl
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setDescription('');
        handleRemovePhoto();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-md my-auto rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/15 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header (Fixed) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-sm shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">Submit Safety Intel</h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-light">Share ground-level conditions to keep others safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-2.5 relative z-10 my-auto">
            <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto animate-bounce drop-shadow-md" />
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">Report Successfully Submitted!</div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-light max-w-xs mx-auto">
              Status set to <strong className="text-amber-600 dark:text-amber-400 font-semibold">Reported</strong>. It is now visible on the safety map and actively factored into nearby route evaluations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col min-h-0 flex-1 mt-3">
            {/* Scrollable Form Body */}
            <div className="overflow-y-auto pr-1 space-y-3.5 flex-1 max-h-[calc(90vh-130px)]">
              {!currentUser && (
                <div className="glass-card bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-2.5 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2 shadow-sm">
                  <span>Submitting as Community Contributor.</span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="font-bold underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white transition-colors shrink-0"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="glass-card bg-rose-500/15 border border-rose-400/40 rounded-xl p-2.5 text-xs text-rose-800 dark:text-rose-200 shadow-sm">
                  {errorMsg}
                </div>
              )}

              {/* Category selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all duration-200 ${
                        category === cat.id
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                          : 'glass-card border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="text-xs">{cat.label}</div>
                      <div className="text-[9px] opacity-75 truncate font-light">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono">
                  Description / Condition
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the issue (e.g. broken lamppost on west sidewalk, zero lighting past 9pm)..."
                  className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all resize-none font-light"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Attach Photo Evidence (Optional)</span>
                  </span>
                  {selectedPhotoFile && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Photo Attached</span>
                  )}
                </label>

                {photoPreviewUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900/80 p-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={photoPreviewUrl}
                        alt="Hazard evidence preview"
                        className="w-12 h-12 object-cover rounded-lg border border-white/20 shrink-0"
                      />
                      <div className="truncate text-xs">
                        <div className="font-semibold text-slate-200 truncate">{selectedPhotoFile?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(selectedPhotoFile?.size ? (selectedPhotoFile.size / 1024).toFixed(1) : 0)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors shrink-0"
                      title="Remove attached photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-slate-300 dark:border-white/15 rounded-xl cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all text-center">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                      <span>Upload ground photo (JPEG, PNG)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Stored securely with report metadata</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Coordinates */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Location Coordinates</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-light">Tip: Click map to pin</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none font-mono"
                  />
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Disclaimer on verification */}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-light">
                Note: Submissions start with <em>Reported</em> status until confirmed by community members or verified against official civic channels.
              </div>
            </div>

            {/* Buttons (Fixed Footer) */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08] mt-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.35)] border border-amber-400/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
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
