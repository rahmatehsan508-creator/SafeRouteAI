import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Search, 
  Info, 
  Check, 
  X, 
  RotateCcw, 
  Compass, 
  Wifi, 
  Radio, 
  Sparkles,
  Loader2,
  Navigation
} from 'lucide-react';
import { Coordinates, GpsLocation } from '../types';
import { geocodeAddress, POPULAR_PRESETS, reverseGeocode } from '../services/geocoding';

interface LocationCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGpsLocation: GpsLocation | null;
  onCalibrateLocation: (coords: Coordinates, addressName: string) => void;
  onResetToGps: () => void;
  onEnableMapPinpointMode: () => void;
}

export const LocationCalibrationModal: React.FC<LocationCalibrationModalProps> = ({
  isOpen,
  onClose,
  currentGpsLocation,
  onCalibrateLocation,
  onResetToGps,
  onEnableMapPinpointMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; formattedAddress: string; coordinates: Coordinates }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualLat, setManualLat] = useState(currentGpsLocation ? currentGpsLocation.latitude.toFixed(5) : '22.5448');
  const [manualLng, setManualLng] = useState(currentGpsLocation ? currentGpsLocation.longitude.toFixed(5) : '88.3426');
  const [activeMode, setActiveMode] = useState<'search' | 'coordinates'>('search');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  // When opening modal, reverse geocode current coordinates so user sees what ISP location was detected
  useEffect(() => {
    if (isOpen && currentGpsLocation) {
      setManualLat(currentGpsLocation.latitude.toFixed(5));
      setManualLng(currentGpsLocation.longitude.toFixed(5));
      setIsReverseGeocoding(true);
      reverseGeocode(currentGpsLocation.latitude, currentGpsLocation.longitude)
        .then((addr) => setDetectedAddress(addr))
        .catch(() => setDetectedAddress(null))
        .finally(() => setIsReverseGeocoding(false));
    }
  }, [isOpen, currentGpsLocation?.latitude, currentGpsLocation?.longitude]);

  // Debounced search for address
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geocodeAddress(searchQuery.trim());
        setSuggestions(results.slice(0, 5));
      } catch (err) {
        console.warn('Calibration geocode error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (item: { name: string; formattedAddress: string; coordinates: Coordinates }) => {
    onCalibrateLocation(item.coordinates, item.formattedAddress || item.name);
    onClose();
  };

  const handleApplyCoordinates = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    let resolvedName = `Exact Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) resolvedName = addr;
    } catch {}

    onCalibrateLocation({ lat, lng }, resolvedName);
    onClose();
  };

  const handlePinpointOnMap = () => {
    onEnableMapPinpointMode();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-lg rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/15 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Calibrate Exact Location</span>
                {currentGpsLocation?.isCalibrated && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                    Calibrated
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Fix ~15 km Wi-Fi / ISP displacement with street-level precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 relative z-10">
          {/* Explanation Alert Box */}
          <div className="glass-card bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-200 block">Why was your location ~15 km away?</span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                Desktop computers and Wi-Fi networks lack satellite GPS receivers. Browsers estimate your position using your ISP’s regional routing center or cellular tower, which can be 10–25 km away.
              </p>
              {detectedAddress && (
                <div className="mt-1.5 pt-1.5 border-t border-cyan-500/20 text-[10px] text-cyan-300/90 font-mono">
                  Current Browser Reading: <span className="text-white font-sans">{detectedAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action: Pinpoint on Map */}
          <button
            onClick={handlePinpointOnMap}
            className="w-full group p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600/30 via-blue-600/20 to-indigo-600/30 hover:from-cyan-500/40 hover:to-indigo-500/40 border border-cyan-400/40 text-left transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block group-hover:text-cyan-200">
                  🎯 Click or Drag on Live Map
                </span>
                <span className="text-[11px] text-slate-400">
                  Tap your exact house, building or intersection directly on the map
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-400/30 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
              Pick on Map
            </span>
          </button>

          {/* Mode Switcher */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveMode('search')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'search'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Address</span>
            </button>
            <button
              onClick={() => setActiveMode('coordinates')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'coordinates'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Exact Coordinates</span>
            </button>
          </div>

          {/* Search Tab */}
          {activeMode === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-slate-400">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Search className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type your street, colony, or landmark (e.g. Park Street, Bally)..."
                  className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              {/* Suggestions List */}
              {suggestions.length > 0 && (
                <div className="glass-panel-elevated rounded-xl border border-cyan-500/20 overflow-hidden divide-y divide-white/[0.06]">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full p-3 text-left hover:bg-cyan-500/15 transition-colors flex items-start gap-2.5 text-xs text-slate-200 group"
                    >
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{item.formattedAddress}</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono mt-0.5">Select</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Common presets */}
              {suggestions.length === 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                    Quick Landmark Presets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_PRESETS.slice(0, 4).map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion({
                          name: preset.label,
                          formattedAddress: preset.address,
                          coordinates: preset.coords
                        })}
                        className="p-2.5 rounded-xl glass-card bg-slate-900/60 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-left text-xs text-slate-200 transition-all flex items-center gap-2 group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coordinates Tab */}
          {activeMode === 'coordinates' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    placeholder="22.5448"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    placeholder="88.3426"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyCoordinates}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply Exact Coordinates</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs relative z-10">
          <button
            onClick={() => {
              onResetToGps();
              onClose();
            }}
            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors py-1.5"
            title="Reset to browser default GPS"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Browser GPS</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl glass-card bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
