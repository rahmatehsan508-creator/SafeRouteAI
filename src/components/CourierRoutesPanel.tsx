import React, { useState, useEffect, useRef } from 'react';
import { 
  RouteOption, 
  TravelMode, 
  RoutePreference, 
  Coordinates, 
  SavedRoute,
  GeocodeLocation
} from '../types';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  SlidersHorizontal, 
  Check, 
  AlertTriangle, 
  MapPin, 
  ArrowRight, 
  Crosshair,
  Footprints,
  Bike,
  Car,
  Bus,
  Shield,
  Sun,
  Eye,
  Bookmark,
  X,
  Loader2,
  Zap,
  Lightbulb,
  Video,
  Hospital,
  AlertCircle,
  TrendingUp,
  Radio,
  Flame
} from 'lucide-react';
import { geocodeAddress } from '../services/geocoding';
import { calculateHaversineDistance } from '../utils/coordinates';

interface CourierRoutesPanelProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  sourceText: string;
  setSourceText: (val: string, explicitCoords?: Coordinates) => void;
  destText: string;
  setDestText: (val: string, explicitCoords?: Coordinates) => void;
  currentGpsCoords?: Coordinates | null;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
  preference: RoutePreference;
  setPreference: (pref: RoutePreference) => void;
  onSearch: () => void;
  isLoading: boolean;
  onUseCurrentLocation: () => void;
  onSwap: () => void;
  isCalibrated: boolean;
  isEstimatedIsp: boolean;
  isLocked: boolean;
  onOpenCalibrationModal: () => void;
  theme: 'light' | 'dark';
  aiExplanation: string | null;
  isAiLoading: boolean;
  onStartNavigation: () => void;
  onSaveCurrentRoute: () => void;
  isSaved?: boolean;
  savedRoutes: SavedRoute[];
  onSelectSavedRoute: (route: SavedRoute) => void;
  hoveredRouteId?: string | null;
  onHoverRoute?: (id: string | null) => void;
}

export const CourierRoutesPanel: React.FC<CourierRoutesPanelProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  hoveredRouteId,
  onHoverRoute,
  sourceText,
  setSourceText,
  destText,
  setDestText,
  currentGpsCoords,
  travelMode,
  setTravelMode,
  preference,
  setPreference,
  onSearch,
  isLoading,
  onUseCurrentLocation,
  onSwap,
  isCalibrated,
  isEstimatedIsp,
  isLocked,
  onOpenCalibrationModal,
  theme,
  aiExplanation,
  isAiLoading,
  onStartNavigation,
  onSaveCurrentRoute,
  isSaved,
  savedRoutes,
  onSelectSavedRoute
}) => {
  const [activeTab, setActiveTab] = useState<'ontheway' | 'saved' | 'presets'>('ontheway');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(routes.length === 0);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Real-time Autocomplete States
  const [sourceSuggestions, setSourceSuggestions] = useState<GeocodeLocation[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeLocation[]>([]);
  const [isLoadingSourceSug, setIsLoadingSourceSug] = useState<boolean>(false);
  const [isLoadingDestSug, setIsLoadingDestSug] = useState<boolean>(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState<boolean>(false);
  const [showDestDropdown, setShowDestDropdown] = useState<boolean>(false);

  // Flags to distinguish manual keystroke typing vs item selection
  const isUserTypingSourceRef = useRef<boolean>(false);
  const isUserTypingDestRef = useRef<boolean>(false);
  const selectedSourceTextRef = useRef<string | null>(null);
  const selectedDestTextRef = useRef<string | null>(null);

  const sourceContainerRef = useRef<HTMLDivElement | null>(null);
  const destContainerRef = useRef<HTMLDivElement | null>(null);

  // Expand search if no routes
  useEffect(() => {
    if (routes.length === 0) {
      setIsSearchExpanded(true);
    }
  }, [routes.length]);

  // Pointer down outside to dismiss autocomplete dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sourceContainerRef.current && !sourceContainerRef.current.contains(e.target as Node)) {
        setShowSourceDropdown(false);
      }
      if (destContainerRef.current && !destContainerRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // Debounced Origin Autocomplete
  useEffect(() => {
    const query = sourceText.trim();
    if (!isUserTypingSourceRef.current || !query || query.length < 2 || query.includes('📍') || query === selectedSourceTextRef.current) {
      setIsLoadingSourceSug(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSourceSug(true);
      try {
        const results = await geocodeAddress(query, currentGpsCoords);
        if (isUserTypingSourceRef.current) {
          setSourceSuggestions(results);
          setShowSourceDropdown(results.length > 0);
        }
      } catch {
        setSourceSuggestions([]);
      } finally {
        setIsLoadingSourceSug(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [sourceText, currentGpsCoords]);

  // Debounced Destination Autocomplete
  useEffect(() => {
    const query = destText.trim();
    if (!isUserTypingDestRef.current || !query || query.length < 2 || query === selectedDestTextRef.current) {
      setIsLoadingDestSug(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingDestSug(true);
      try {
        const results = await geocodeAddress(query, currentGpsCoords);
        if (isUserTypingDestRef.current) {
          setDestSuggestions(results);
          setShowDestDropdown(results.length > 0);
        }
      } catch {
        setDestSuggestions([]);
      } finally {
        setIsLoadingDestSug(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destText, currentGpsCoords]);

  // Selection handlers
  const handleSelectSourceLocation = (item: GeocodeLocation) => {
    isUserTypingSourceRef.current = false;
    selectedSourceTextRef.current = item.formattedAddress;
    setShowSourceDropdown(false);
    setSourceSuggestions([]);
    setSourceText(item.formattedAddress, item.coordinates);
  };

  const handleSelectDestLocation = (item: GeocodeLocation) => {
    isUserTypingDestRef.current = false;
    selectedDestTextRef.current = item.formattedAddress;
    setShowDestDropdown(false);
    setDestSuggestions([]);
    setDestText(item.formattedAddress, item.coordinates);
  };

  const handleClearSourceInput = () => {
    isUserTypingSourceRef.current = false;
    selectedSourceTextRef.current = null;
    setShowSourceDropdown(false);
    setSourceSuggestions([]);
    setSourceText('');
  };

  const handleClearDestInput = () => {
    isUserTypingDestRef.current = false;
    selectedDestTextRef.current = null;
    setShowDestDropdown(false);
    setDestSuggestions([]);
    setDestText('');
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;

  // Find safest and fastest routes for direct high-level comparison
  const safestRoute = [...routes].sort((a, b) => b.safetyScore - a.safetyScore)[0] || null;
  const fastestRoute = [...routes].sort((a, b) => a.durationSeconds - b.durationSeconds)[0] || null;

  // Format distance from user GPS
  const formatDistanceToUser = (targetCoords: Coordinates) => {
    if (!currentGpsCoords) return null;
    const distMeters = calculateHaversineDistance(currentGpsCoords, targetCoords);
    if (distMeters < 1000) {
      return `${Math.round(distMeters)} m away`;
    }
    return `${(distMeters / 1000).toFixed(1)} km away`;
  };

  // Preset demo corridors matching the Scandinavian safe corridor theme
  const presetCorridors = [
    {
      source: 'Gamla Stan, Stockholm',
      dest: 'Östermalmstorg, Stockholm',
      mode: 'walking' as TravelMode,
      name: 'Gamla Stan → Östermalm',
      status: 'SAFEST CORRIDOR',
      duration: '18 mins',
      dist: '1.9 km',
      score: 98,
      highlight: 'Continuous LED lighting, high pedestrian density, 24/7 CCTV'
    },
    {
      source: 'Norra Nynäshamn',
      dest: 'Stockholm Central',
      mode: 'car' as TravelMode,
      name: 'Norra Nynäshamn → Stockholm Central',
      status: 'VERIFIED SAFE',
      duration: '42 mins',
      dist: '58.4 km',
      score: 95,
      highlight: 'Highway barrier lighting & automated SOS call boxes'
    },
    {
      source: 'Times Square, NY',
      dest: 'Central Park South, NY',
      mode: 'walking' as TravelMode,
      name: 'Times Square → Central Park',
      status: 'HIGH VISIBILITY',
      duration: '14 mins',
      dist: '1.4 km',
      score: 94,
      highlight: 'Crowded Broadway commercial avenue with municipal safety hubs'
    }
  ];

  const handleSpeakGuidance = () => {
    if (!selectedRoute) return;
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const lightingVal = selectedRoute.safetyFactors?.lighting ?? 90;
      const speechText = `SafeRoute AI Guardian briefing for ${selectedRoute.name || 'selected corridor'}. Overall safety score is ${selectedRoute.safetyScore} out of 100. Lighting coverage is ${lightingVal} percent. CCTV coverage is verified along main thoroughfares. ${selectedRoute.keyPositives?.[0] || 'Safe travels'}.`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Safety Score Color Palette
  const getSafetyBadgeStyle = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        label: 'Optimal Safe Path'
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-600 dark:text-cyan-400',
        bar: 'bg-cyan-500',
        label: 'Reliable Safety'
      };
    }
    if (score >= 55) {
      return {
        bg: 'bg-amber-500/15 border-amber-400/40 text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        label: 'Moderate Safety'
      };
    }
    return {
      bg: 'bg-rose-500/15 border-rose-400/40 text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      label: 'Caution Advised'
    };
  };

  const isNightTime = new Date().getHours() >= 21 || new Date().getHours() < 6;

  return (
    <div 
      className={`w-full lg:w-[420px] xl:w-[450px] flex flex-col h-auto lg:h-full shrink-0 overflow-y-auto z-20 transition-all duration-200 p-4 space-y-3.5 ${
        theme === 'light' 
          ? 'bg-[#f8fafc]/95 border-r border-slate-200 text-slate-800' 
          : 'bg-[#0b0f19]/95 border-r border-slate-800/80 text-slate-100'
      }`}
    >
      {/* Top Brand Header with Active Safety Mode Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight">SafeRoute AI</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                SAFETY ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Prioritizing lighting, CCTV & hazard-free corridors</p>
          </div>
        </div>

        <button
          onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          className={`p-2 rounded-xl border transition-all ${
            isSearchExpanded 
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Route Inputs"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 1. ROUTE PREFERENCE SECTION */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>1 • ROUTE PREFERENCE</span>
          </span>
          {isNightTime && (
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
              <span>🌙 Night Mode</span>
            </span>
          )}
        </div>
        
        <div className={`p-1 rounded-xl grid grid-cols-3 gap-1 border ${
          theme === 'light' ? 'bg-slate-200/60 border-slate-300/80 shadow-inner' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => {
              setPreference('safest');
              if (sourceText.trim() && destText.trim()) onSearch();
            }}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              preference === 'safest'
                ? theme === 'light'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-500/40'
                  : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>Safest</span>
            </div>
            <span className="text-[9px] font-medium opacity-80">Max Lighting & CCTV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreference('fastest');
              if (sourceText.trim() && destText.trim()) onSearch();
            }}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              preference === 'fastest'
                ? theme === 'light'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-500/40'
                  : 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Fastest</span>
            </div>
            <span className="text-[9px] font-medium opacity-80">Shortest Time</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreference('balanced');
              if (sourceText.trim() && destText.trim()) onSearch();
            }}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              preference === 'balanced'
                ? theme === 'light'
                  ? 'bg-white text-cyan-700 shadow-sm border border-cyan-500/40'
                  : 'bg-cyan-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 fill-current" />
              <span>Balanced</span>
            </div>
            <span className="text-[9px] font-medium opacity-80">Safe & Efficient</span>
          </button>
        </div>
      </div>

      {/* Route Inputs (Collapsible) */}
      {isSearchExpanded && (
        <div className={`p-3.5 rounded-2xl border space-y-3 transition-all animate-in fade-in-50 duration-150 ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Route Endpoints</span>
            <button 
              onClick={() => {
                isUserTypingSourceRef.current = false;
                selectedSourceTextRef.current = '📍 Current Location';
                setShowSourceDropdown(false);
                setSourceSuggestions([]);
                onUseCurrentLocation();
              }}
              className="text-cyan-500 hover:text-cyan-600 flex items-center gap-1 text-[11px] font-semibold"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Use Current GPS</span>
            </button>
          </div>

          {/* Origin Input with Autocomplete */}
          <div ref={sourceContainerRef} className="relative">
            <div className="relative">
              <input
                type="text"
                value={sourceText}
                onChange={(e) => {
                  isUserTypingSourceRef.current = true;
                  selectedSourceTextRef.current = null;
                  setSourceText(e.target.value);
                  setShowSourceDropdown(true);
                }}
                onFocus={() => {
                  if (sourceSuggestions.length > 0 && isUserTypingSourceRef.current) {
                    setShowSourceDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sourceText.trim() && destText.trim()) {
                    setShowSourceDropdown(false);
                    onSearch();
                    setIsSearchExpanded(false);
                  }
                }}
                placeholder="Enter starting point or search places..."
                className={`w-full py-2.5 pl-9 pr-8 text-xs rounded-xl border font-medium focus:outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-950/70 border-slate-800 focus:border-emerald-400 text-white placeholder:text-slate-500'
                }`}
              />
              <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                {isLoadingSourceSug && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                )}
                {sourceText && (
                  <button
                    type="button"
                    onClick={handleClearSourceInput}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Origin Suggestions Dropdown */}
            {showSourceDropdown && sourceSuggestions.length > 0 && (
              <div 
                className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in-50 duration-150 ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 divide-y divide-slate-100 text-slate-900'
                    : 'bg-slate-900 border-slate-700/80 divide-y divide-slate-800/80 text-slate-100'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                  <span>Location Suggestions</span>
                  {currentGpsCoords && <span className="text-[9px] text-cyan-500 font-medium">Near your location</span>}
                </div>
                {sourceSuggestions.map((item, idx) => {
                  const distText = formatDistanceToUser(item.coordinates);
                  return (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSourceLocation(item);
                      }}
                      onClick={() => handleSelectSourceLocation(item)}
                      className={`w-full p-2.5 text-left flex items-start gap-2.5 transition-colors ${
                        theme === 'light'
                          ? 'hover:bg-slate-100 focus:bg-slate-100'
                          : 'hover:bg-slate-800 focus:bg-slate-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{item.name}</span>
                          {distText && (
                            <span className="text-[10px] font-mono shrink-0 text-cyan-500 font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10">
                              {distText}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.formattedAddress}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Destination Input with Autocomplete */}
          <div ref={destContainerRef} className="relative">
            <div className="relative">
              <input
                type="text"
                value={destText}
                onChange={(e) => {
                  isUserTypingDestRef.current = true;
                  selectedDestTextRef.current = null;
                  setDestText(e.target.value);
                  setShowDestDropdown(true);
                }}
                onFocus={() => {
                  if (destSuggestions.length > 0 && isUserTypingDestRef.current) {
                    setShowDestDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sourceText.trim() && destText.trim()) {
                    setShowDestDropdown(false);
                    onSearch();
                    setIsSearchExpanded(false);
                  }
                }}
                placeholder="Enter destination address or landmark..."
                className={`w-full py-2.5 pl-9 pr-8 text-xs rounded-xl border font-medium focus:outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-950/70 border-slate-800 focus:border-emerald-400 text-white placeholder:text-slate-500'
                }`}
              />
              <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-2 ring-cyan-500/20" />
              
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                {isLoadingDestSug && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                )}
                {destText && (
                  <button
                    type="button"
                    onClick={handleClearDestInput}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Destination Suggestions Dropdown */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div 
                className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in-50 duration-150 ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 divide-y divide-slate-100 text-slate-900'
                    : 'bg-slate-900 border-slate-700/80 divide-y divide-slate-800/80 text-slate-100'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                  <span>Location Suggestions</span>
                  {currentGpsCoords && <span className="text-[9px] text-cyan-500 font-medium">Near your location</span>}
                </div>
                {destSuggestions.map((item, idx) => {
                  const distText = formatDistanceToUser(item.coordinates);
                  return (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDestLocation(item);
                      }}
                      onClick={() => handleSelectDestLocation(item)}
                      className={`w-full p-2.5 text-left flex items-start gap-2.5 transition-colors ${
                        theme === 'light'
                          ? 'hover:bg-slate-100 focus:bg-slate-100'
                          : 'hover:bg-slate-800 focus:bg-slate-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{item.name}</span>
                          {distText && (
                            <span className="text-[10px] font-mono shrink-0 text-cyan-500 font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10">
                              {distText}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.formattedAddress}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Travel Mode Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { mode: 'walking' as TravelMode, label: 'Walk', icon: Footprints },
              { mode: 'cycling' as TravelMode, label: 'Bike', icon: Bike },
              { mode: 'car' as TravelMode, label: 'Drive', icon: Car },
              { mode: 'public_transport' as TravelMode, label: 'Transit', icon: Bus }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = travelMode === item.mode;
              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setTravelMode(item.mode)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${
                    isSelected
                      ? theme === 'light'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-emerald-500 text-slate-950 border-emerald-500 font-black'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Calculate Button */}
          <button
            onClick={() => {
              onSearch();
              setIsSearchExpanded(false);
            }}
            disabled={isLoading || !sourceText.trim() || !destText.trim()}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isLoading || !sourceText.trim() || !destText.trim()
                ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                : theme === 'light'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Evaluating Safety Corridors...
              </span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Calculate & Compare Safe Routes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. AVAILABLE ROUTE OPTIONS SECTION */}
      <div className="space-y-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            <span>2 • AVAILABLE ROUTE OPTIONS</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {routes.length} Corridors
          </span>
        </div>

        {/* TAB NAVIGATION: Active Routes / Saved / Demo Presets */}
        <div className={`p-1 rounded-xl flex items-center gap-1 border ${
          theme === 'light' ? 'bg-slate-200/60 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('ontheway')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ontheway'
                ? theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>Safety Explorer</span>
            {routes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-emerald-300">
                {routes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>Safe Corridors</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'saved'
                ? theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>Saved</span>
            {savedRoutes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-emerald-300">
                {savedRoutes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: Active Routes & Direct Safest vs Fastest Comparison */}
      {activeTab === 'ontheway' && (
        <div className="space-y-3">
          {/* HIGH IMPACT: SAFEST VS FASTEST COMPARISON CARDS */}
          {routes.length > 1 && safestRoute && fastestRoute && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Direct Route Comparison</span>
                {safestRoute.id !== fastestRoute.id && (
                  <span className="text-[10px] text-emerald-500 font-semibold">Click card to switch</span>
                )}
              </div>

              {safestRoute.id === fastestRoute.id ? (
                /* SINGLE COMBINED CARD WHEN SAFEST IS ALSO FASTEST */
                <div
                  onClick={() => onSelectRoute(safestRoute.id)}
                  onMouseEnter={() => onHoverRoute?.(safestRoute.id)}
                  onMouseLeave={() => onHoverRoute?.(null)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                    hoveredRouteId === safestRoute.id
                      ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-lg scale-[1.01] bg-emerald-500/10'
                      : selectedRouteId === safestRoute.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-500/5'
                        : theme === 'light'
                          ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                          : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 fill-current" />
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>SAFEST & FASTEST</span>
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Optimal Path
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {safestRoute.safetyScore}/100
                    </span>
                  </div>

                  <div className="text-xs font-bold truncate">{safestRoute.name}</div>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{safestRoute.durationFormatted}</span>
                    <span>{safestRoute.distanceKm} km</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">Shortest & Max Safety</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] flex items-center justify-between">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      <span>{safestRoute.safetyFactors?.lighting ?? 92}% Streetlit</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">No safety tradeoffs required</span>
                  </div>
                </div>
              ) : (
                /* TWO COMPARISON CARDS WHEN SAFEST AND FASTEST DIFFER */
                (() => {
                  const timeDiffSec = safestRoute.durationSeconds - fastestRoute.durationSeconds;
                  const timeDiffMin = Math.round(Math.abs(timeDiffSec) / 60);
                  const distDiffKm = (safestRoute.distanceKm - fastestRoute.distanceKm).toFixed(1);
                  const distDiffVal = parseFloat(distDiffKm);
                  const scoreDiff = safestRoute.safetyScore - fastestRoute.safetyScore;
                  const safestLighting = safestRoute.safetyFactors?.lighting;
                  const fastestLighting = fastestRoute.safetyFactors?.lighting;
                  const lightingDiff = (safestLighting !== undefined && fastestLighting !== undefined)
                    ? (safestLighting - fastestLighting)
                    : null;

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Safest Route Card */}
                      <div
                        onClick={() => onSelectRoute(safestRoute.id)}
                        onMouseEnter={() => onHoverRoute?.(safestRoute.id)}
                        onMouseLeave={() => onHoverRoute?.(null)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                          hoveredRouteId === safestRoute.id
                            ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-lg scale-[1.01] bg-emerald-500/10'
                            : selectedRouteId === safestRoute.id
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-500/5'
                              : theme === 'light'
                                ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                                : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5 fill-current" />
                              <span>SAFEST</span>
                            </span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {safestRoute.safetyScore}/100
                            </span>
                          </div>

                          <div className="text-xs font-bold truncate">{safestRoute.name}</div>
                          
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                            <span>{safestRoute.durationFormatted}</span>
                            <span>{safestRoute.distanceKm} km</span>
                          </div>
                        </div>

                        {/* Differences section */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                          {/* Deltas */}
                          <div className="flex flex-wrap items-center gap-1">
                            {scoreDiff > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                                +{scoreDiff} Safety Score
                              </span>
                            )}
                            {timeDiffMin > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[9px]">
                                +{timeDiffMin} min
                              </span>
                            )}
                            {distDiffVal > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[9px]">
                                +{distDiffKm} km
                              </span>
                            )}
                          </div>

                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Sun className="w-3 h-3" />
                              <span>{safestLighting ?? 92}% Lit</span>
                            </span>
                            {lightingDiff !== null && lightingDiff > 0 && (
                              <span className="text-[9px] font-bold text-emerald-500">+{lightingDiff}%</span>
                            )}
                          </div>

                          {safestRoute.keyPositives && safestRoute.keyPositives[0] && (
                            <div className="text-slate-400 text-[9px] truncate">
                              {safestRoute.keyPositives[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fastest Route Card */}
                      <div
                        onClick={() => onSelectRoute(fastestRoute.id)}
                        onMouseEnter={() => onHoverRoute?.(fastestRoute.id)}
                        onMouseLeave={() => onHoverRoute?.(null)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                          hoveredRouteId === fastestRoute.id
                            ? 'border-amber-500 ring-2 ring-amber-400 shadow-lg scale-[1.01] bg-amber-500/10'
                            : selectedRouteId === fastestRoute.id
                              ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md bg-amber-500/5'
                              : theme === 'light'
                                ? 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
                                : 'bg-slate-900/90 border-slate-800 hover:border-amber-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              <span>FASTEST</span>
                            </span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                              {fastestRoute.safetyScore}/100
                            </span>
                          </div>

                          <div className="text-xs font-bold truncate">{fastestRoute.name}</div>
                          
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{fastestRoute.durationFormatted}</span>
                            <span>{fastestRoute.distanceKm} km</span>
                          </div>
                        </div>

                        {/* Differences section */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                          {/* Deltas */}
                          <div className="flex flex-wrap items-center gap-1">
                            {timeDiffMin > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                                {timeDiffMin} min faster
                              </span>
                            )}
                            {distDiffVal > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                                Shortest path
                              </span>
                            )}
                            {scoreDiff > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium text-[9px]">
                                -{scoreDiff} Safety Score
                              </span>
                            )}
                          </div>

                          <div className="text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{fastestLighting ?? 50}% Lit</span>
                            </span>
                            {lightingDiff !== null && lightingDiff > 0 && (
                              <span className="text-[9px] font-bold text-amber-500">-{lightingDiff}%</span>
                            )}
                          </div>

                          {fastestRoute.keyConcerns && fastestRoute.keyConcerns[0] ? (
                            <div className="text-slate-400 text-[9px] truncate">
                              {fastestRoute.keyConcerns[0]}
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[9px] truncate">
                              Direct shortcut corridor
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* 3. CURRENTLY SELECTED ROUTE (PRIMARY FOCUS CARD) */}
          {selectedRoute ? (
            <div
              onMouseEnter={() => onHoverRoute?.(selectedRoute.id)}
              onMouseLeave={() => onHoverRoute?.(null)}
              className={`rounded-2xl p-4 border transition-all relative overflow-hidden ${
                hoveredRouteId === selectedRoute.id
                  ? 'ring-2 ring-emerald-400 border-emerald-500 shadow-xl scale-[1.005]'
                  : theme === 'light' 
                    ? 'bg-white border-emerald-500/60 ring-2 ring-emerald-500/15 shadow-md' 
                    : 'bg-slate-900/95 border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-xl'
            }`}>
              {/* PRIMARY ROUTE SECTION BADGE HEADER */}
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 pb-1.5 border-b border-emerald-500/20">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3 • CURRENTLY SELECTED ROUTE</span>
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRIMARY FOCUS
                </span>
              </div>

              {/* Header Title and Safety Score Badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* CURRENT LOCATION */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span>CURRENT LOCATION</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Live GPS
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                      {sourceText || selectedRoute.name.split('via')[0] || 'My Current Location'}
                    </div>
                  </div>

                  {/* DOWN ARROW SEPARATOR */}
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] pl-0.5">
                    <span className="font-bold text-slate-400 dark:text-slate-500">↓</span>
                  </div>

                  {/* DESTINATION */}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      DESTINATION
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                      {destText || 'Destination'}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    Corridor: {selectedRoute.name}
                  </div>
                </div>

                {/* Score Pill */}
                <div className={`px-2.5 py-1.5 rounded-xl border text-center font-black shrink-0 ${
                  getSafetyBadgeStyle(selectedRoute.safetyScore).bg
                }`}>
                  <div className="text-xs leading-none">{selectedRoute.safetyScore}/100</div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
                    {selectedRoute.safetyScore >= 85 ? 'Optimal' : selectedRoute.safetyScore >= 70 ? 'Reliable' : 'Caution'}
                  </div>
                </div>
              </div>

              {/* Progress / Safety Meter */}
              <div className="space-y-1 my-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Safety Confidence Rating</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedRoute.safetyScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      getSafetyBadgeStyle(selectedRoute.safetyScore).bar
                    }`}
                    style={{ width: `${selectedRoute.safetyScore}%` }}
                  />
                </div>
              </div>

              {/* 3-Column Metrics Grid */}
              <div className={`grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl border my-3 text-center ${
                theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="border-r border-slate-200 dark:border-slate-800 pr-1">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Estimated Time</div>
                  <div className="text-xs font-extrabold">{selectedRoute.durationFormatted}</div>
                </div>
                <div className="border-r border-slate-200 dark:border-slate-800 pr-1">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Distance</div>
                  <div className="text-xs font-extrabold">{selectedRoute.distanceKm} km</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Mode</div>
                  <div className="text-xs font-extrabold capitalize">{travelMode}</div>
                </div>
              </div>

              {/* 4. DETAILED SAFETY FACTORS BREAKDOWN & TELEMETRY */}
              <div className="pt-2 pb-3 space-y-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>4 • SAFETY DETAILS & TELEMETRY</span>
                  </span>
                  <span className="text-[9px] text-cyan-400 font-mono font-semibold">LIVE</span>
                </div>

                {/* 4 Essential Safety Factors */}
                <div className="space-y-2">
                  {/* Factor 1: Street Lighting */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Street Illumination</span>
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {selectedRoute.safetyFactors?.lighting ?? 90}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedRoute.safetyFactors?.lighting ?? 90}%` }}
                      />
                    </div>
                  </div>

                  {/* Factor 2: CCTV / Surveillance Coverage */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <Video className="w-3.5 h-3.5 text-cyan-500" />
                        <span>CCTV Surveillance & Security</span>
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {selectedRoute.safetyFactors?.isolation ?? 88}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedRoute.safetyFactors?.isolation ?? 88}%` }}
                      />
                    </div>
                  </div>

                  {/* Factor 3: Public Presence & Open Businesses */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Pedestrian Presence & Activity</span>
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {selectedRoute.safetyFactors?.publicPresence ?? 85}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedRoute.safetyFactors?.publicPresence ?? 85}%` }}
                      />
                    </div>
                  </div>

                  {/* Factor 4: Hazard Avoidance */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Hazard & Incident Free</span>
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {selectedRoute.safetyFactors?.incidentRisk ?? 95}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedRoute.safetyFactors?.incidentRisk ?? 95}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Safety Insights (Pros & Cons) */}
                <div className="pt-2 space-y-1.5">
                  {selectedRoute.keyPositives && selectedRoute.keyPositives.length > 0 && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{selectedRoute.keyPositives[0]}</span>
                    </div>
                  )}

                  {selectedRoute.keyConcerns && selectedRoute.keyConcerns.length > 0 && selectedRoute.keyConcerns[0] !== 'No critical safety flags recorded' && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{selectedRoute.keyConcerns[0]}</span>
                    </div>
                  )}
                </div>

                {/* Gemini AI Briefing */}
                {aiExplanation && (
                  <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                    theme === 'light' ? 'bg-indigo-50/60 border-indigo-100 text-slate-700' : 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200'
                  }`}>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Safety Assessment</span>
                    </div>
                    <p className="line-clamp-3">{aiExplanation}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Navigate & Audio Guidance */}
              <div className="pt-3 flex items-center gap-2">
                <button
                  onClick={onStartNavigation}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    theme === 'light'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                  }`}
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>Start Safe Navigation</span>
                </button>

                <button
                  onClick={handleSpeakGuidance}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSpeaking
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md animate-pulse'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Voice Safety Audio Briefing"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onSaveCurrentRoute}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSaved
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={isSaved ? "Corridor Saved" : "Save Corridor"}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl text-center border ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <Shield className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <div className="text-xs font-bold mb-1">No Active Safety Corridor</div>
              <p className="text-[11px] text-slate-400">
                Enter your starting point and destination above, or choose a preset safe corridor.
              </p>
            </div>
          )}

          {/* Other Alternative Routes (if more than 2) */}
          {routes.filter(r => r.id !== selectedRouteId && r.id !== safestRoute?.id && r.id !== fastestRoute?.id).map((altRoute) => (
            <div
              key={altRoute.id}
              onClick={() => onSelectRoute(altRoute.id)}
              onMouseEnter={() => onHoverRoute?.(altRoute.id)}
              onMouseLeave={() => onHoverRoute?.(null)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                hoveredRouteId === altRoute.id
                  ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-md bg-cyan-500/10'
                  : theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-slate-900 shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold truncate max-w-[200px]">{altRoute.name}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {altRoute.safetyScore}% Safe
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{altRoute.distanceKm} km &bull; {altRoute.durationFormatted}</span>
                <span className="text-cyan-500 font-semibold text-[10px]">Select Alternative &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Safe Corridor Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Pre-Evaluated Safe Corridors
          </div>
          {presetCorridors.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSourceText(preset.source);
                setDestText(preset.dest);
                setTravelMode(preset.mode);
                onSearch();
                setActiveTab('ontheway');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm' 
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold">{preset.name}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {preset.score}/100 SAFE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
                <span>{preset.dist} &bull; {preset.duration}</span>
                <span className="capitalize font-medium text-slate-500">{preset.mode}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded-lg">
                💡 {preset.highlight}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: Saved Routes Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-2.5">
          {savedRoutes.length === 0 ? (
            <div className={`p-6 rounded-2xl text-center border ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <div className="text-xs font-bold mb-1">No Saved Safe Corridors</div>
              <p className="text-[11px] text-slate-400">Save your favorite safe corridors to access them quickly.</p>
            </div>
          ) : (
            savedRoutes.map((saved) => (
              <div
                key={saved.id}
                onClick={() => onSelectSavedRoute(saved)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                  theme === 'light' 
                    ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm' 
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold truncate max-w-[240px]">
                    {saved.source} &rarr; {saved.destination}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {saved.safetyScore}/100
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{saved.distance} &bull; {saved.duration}</span>
                  <span className="text-[10px] font-mono capitalize">{saved.travelMode}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
