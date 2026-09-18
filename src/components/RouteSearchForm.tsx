import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  ArrowUpDown, 
  Footprints, 
  Bike, 
  Car, 
  Bus, 
  Zap, 
  Scale, 
  ShieldCheck, 
  Loader2,
  Crosshair,
  Search
} from 'lucide-react';
import { RoutePreference, TravelMode } from '../types';
import { geocodeAddress, POPULAR_PRESETS } from '../services/geocoding';

interface RouteSearchFormProps {
  sourceText: string;
  setSourceText: (val: string) => void;
  destText: string;
  setDestText: (val: string) => void;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
  preference: RoutePreference;
  setPreference: (pref: RoutePreference) => void;
  onSearch: () => void;
  isLoading: boolean;
  onUseCurrentLocation: () => void;
  onSwap?: () => void;
  onSelectSourceSuggestion?: (item: string) => void;
  onSelectDestSuggestion?: (item: string) => void;
  isCalibrated?: boolean;
  isEstimatedIsp?: boolean;
  isLocked?: boolean;
  onOpenCalibrationModal?: () => void;
  onLockLocation?: () => void;
  onUnlockLocation?: () => void;
}

export const RouteSearchForm: React.FC<RouteSearchFormProps> = ({
  sourceText,
  setSourceText,
  destText,
  setDestText,
  travelMode,
  setTravelMode,
  preference,
  setPreference,
  onSearch,
  isLoading,
  onUseCurrentLocation,
  onSwap,
  onSelectSourceSuggestion,
  onSelectDestSuggestion,
  isCalibrated = false,
  isEstimatedIsp = false,
  isLocked = false,
  onOpenCalibrationModal,
  onLockLocation,
  onUnlockLocation
}) => {
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<'source' | 'dest' | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  // Auto-suggest debounce for source
  useEffect(() => {
    if (activeField !== 'source' || sourceText.trim().length < 2) {
      setSourceSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await geocodeAddress(sourceText);
      setSourceSuggestions(results.map(r => r.name || r.formattedAddress).slice(0, 4));
    }, 280);

    return () => clearTimeout(timer);
  }, [sourceText, activeField]);

  // Auto-suggest debounce for destination
  useEffect(() => {
    if (activeField !== 'dest' || destText.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await geocodeAddress(destText);
      setDestSuggestions(results.map(r => r.name || r.formattedAddress).slice(0, 4));
    }, 280);

    return () => clearTimeout(timer);
  }, [destText, activeField]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    if (onSwap) {
      onSwap();
    } else {
      const temp = sourceText;
      setSourceText(destText);
      setDestText(temp);
    }
  };

  const travelModesList: { id: TravelMode; label: string; icon: any }[] = [
    { id: 'walking', label: 'Walk', icon: Footprints },
    { id: 'cycling', label: 'Bicycle', icon: Bike },
    { id: 'two_wheeler', label: 'Two-Wheeler', icon: Zap },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'public_transport', label: 'Transit', icon: Bus }
  ];

  const preferencesList: { id: RoutePreference; label: string; desc: string; icon: any }[] = [
    { id: 'fastest', label: 'Fastest', desc: 'Prioritize travel time', icon: Zap },
    { id: 'balanced', label: 'Balanced', desc: 'Equal safety & speed weight', icon: Scale },
    { id: 'safest', label: 'Safest', desc: 'Prioritize highest safety rating', icon: ShieldCheck }
  ];

  return (
    <div ref={formRef} className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Decorative ambient background orb inside glass */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Locations Input */}
      <div className="space-y-3 relative z-10">
        {/* Source Field */}
        <div className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Origin / Starting Point</span>
            <div className="flex items-center gap-1.5">
              {isCalibrated || isLocked ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onOpenCalibrationModal}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-all hover:scale-105"
                  >
                    <span>🎯 Locked Spot</span>
                    <span className="underline text-[9px]">Edit</span>
                  </button>
                  {onUnlockLocation && (
                    <button
                      type="button"
                      onClick={onUnlockLocation}
                      className="text-[9px] text-slate-400 hover:text-slate-200 bg-white/5 px-1.5 py-0.5 rounded border border-white/10"
                      title="Unlock GPS"
                    >
                      Unlock
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {onLockLocation && (
                    <button
                      type="button"
                      onClick={onLockLocation}
                      className="text-[10px] text-cyan-300 hover:text-white font-medium flex items-center gap-1 bg-cyan-500/15 hover:bg-cyan-500/30 px-2 py-0.5 rounded-md border border-cyan-500/30 transition-all hover:scale-105"
                      title="Lock current location so it won't fluctuate"
                    >
                      <span>🔒 Lock Spot</span>
                    </button>
                  )}
                  {isEstimatedIsp ? (
                    <button
                      type="button"
                      onClick={onOpenCalibrationModal}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 transition-all hover:scale-105 animate-pulse"
                      title="Browser GPS is approximate (~15km ISP offset). Click to fix your exact spot."
                    >
                      <span>Fix Spot 🎯</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenCalibrationModal}
                      className="text-[10px] text-cyan-400/90 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
                    >
                      <span>🎯 Calibrate</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </label>
          <div className="relative flex items-center group">
            <div className="absolute left-3.5 text-cyan-400 pointer-events-none transition-transform group-focus-within:scale-110">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value);
                setActiveField('source');
              }}
              onFocus={() => setActiveField('source')}
              placeholder="e.g. Victoria Memorial, Kolkata"
              className="glass-input w-full rounded-xl pl-10 pr-11 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onUseCurrentLocation}
              title="Use current GPS location"
              className="absolute right-2.5 p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Source Autocomplete Dropdown */}
          {activeField === 'source' && (sourceSuggestions.length > 0 || sourceText.length === 0) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 glass-panel-elevated rounded-xl shadow-2xl z-50 overflow-hidden py-1 border border-cyan-500/20">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/[0.06]">
                {sourceSuggestions.length > 0 ? 'Address Suggestions' : 'Popular Origins'}
              </div>
              {(sourceSuggestions.length > 0 ? sourceSuggestions : POPULAR_PRESETS.slice(0, 3).map(p => p.label)).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSourceText(item);
                    setActiveField(null);
                    onSelectSourceSuggestion?.(item);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-200 flex items-center gap-2.5 transition-colors border-b border-white/[0.04] last:border-b-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap locations"
            className="w-8 h-8 rounded-full bg-[#0c152d]/90 hover:bg-[#122045] border border-white/15 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-md hover:rotate-180 hover:scale-105"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Field */}
        <div className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Destination Point</span>
            <span className="text-[10px] text-rose-400/90 font-mono">Safety Destination</span>
          </label>
          <div className="relative flex items-center group">
            <div className="absolute left-3.5 text-rose-400 pointer-events-none transition-transform group-focus-within:scale-110">
              <Navigation className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={destText}
              onChange={(e) => {
                setDestText(e.target.value);
                setActiveField('dest');
              }}
              onFocus={() => setActiveField('dest')}
              placeholder="e.g. Howrah Station, Kolkata"
              className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-rose-500/20"
            />
          </div>

          {/* Destination Autocomplete Dropdown */}
          {activeField === 'dest' && (destSuggestions.length > 0 || destText.length === 0) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 glass-panel-elevated rounded-xl shadow-2xl z-50 overflow-hidden py-1 border border-cyan-500/20">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/[0.06]">
                {destSuggestions.length > 0 ? 'Address Suggestions' : 'Popular Destinations'}
              </div>
              {(destSuggestions.length > 0 ? destSuggestions : POPULAR_PRESETS.slice(1, 4).map(p => p.label)).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDestText(item);
                    setActiveField(null);
                    onSelectDestSuggestion?.(item);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-rose-500/15 hover:text-rose-200 flex items-center gap-2.5 transition-colors border-b border-white/[0.04] last:border-b-0"
                >
                  <Navigation className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Travel Mode Pills */}
      <div className="relative z-10">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Travel Mode
        </label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#081024]/80 backdrop-blur-md p-1 rounded-xl border border-white/[0.08] shadow-inner">
          {travelModesList.map((mode) => {
            const Icon = mode.icon;
            const isSelected = travelMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTravelMode(mode.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-semibold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate max-w-[54px]">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route Preference */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Routing Preference
          </label>
          <span className="text-[10px] text-cyan-400/90 font-mono">Affects Ranking</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {preferencesList.map((pref) => {
            const Icon = pref.icon;
            const isSelected = preference === pref.id;
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => setPreference(pref.id)}
                className={`py-2.5 px-2.5 rounded-xl text-left border transition-all duration-200 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'glass-card border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{pref.label}</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5 leading-tight truncate">
                  {pref.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="relative z-10 pt-1">
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading || !sourceText.trim() || !destText.trim()}
          className="w-full bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:via-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] border border-cyan-400/40 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-[1.01] active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="tracking-wide">Evaluating Corridors & Safety Metrics...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-cyan-200" />
              <span className="tracking-wide">Find Safe Routes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
