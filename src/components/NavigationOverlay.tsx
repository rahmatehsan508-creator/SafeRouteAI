import React, { useState, useEffect, useRef } from 'react';
import { GpsLocation, NavigationProgress, RouteOption, TravelMode } from '../types';
import { formatDistance, formatDuration } from '../services/routing';
import {
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  MapPin,
  X,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  Footprints,
  Bike,
  Car,
  LocateFixed,
  Volume2,
  VolumeX,
  Gauge,
  Play,
  Pause,
  ZoomIn,
  Compass,
  ArrowUpRight,
  ArrowUpLeft
} from 'lucide-react';

interface NavigationOverlayProps {
  route: RouteOption;
  travelMode: TravelMode;
  destinationName: string;
  progress: NavigationProgress | null;
  currentGpsLocation?: GpsLocation | null;
  isFollowingLocation?: boolean;
  onExitNavigation: () => void;
  onRecenter: () => void;
  onRecalculateRoute: () => void;
  isRecalculating?: boolean;
  onSimulateMove?: (stepRatio: number) => void;
  onToggleZoom?: () => void;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  route,
  travelMode,
  destinationName,
  progress,
  currentGpsLocation,
  isFollowingLocation = true,
  onExitNavigation,
  onRecenter,
  onRecalculateRoute,
  isRecalculating = false,
  onSimulateMove
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [speedUnit, setSpeedUnit] = useState<'km/h' | 'mph'>('km/h');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationStepRef = useRef<number>(0);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenStepRef = useRef<string | null>(null);

  const currentStep = progress?.currentStep;
  const nextStep = progress?.nextStep;
  const isOffRoute = progress?.isOffRoute ?? false;
  const remainingDist = progress ? progress.remainingDistanceMeters : route.distanceMeters;
  const remainingSecs = progress ? progress.remainingDurationSeconds : route.durationSeconds;

  // Calculate Speed (km/h & mph)
  // Raw GPS speed is in meters per second (m/s)
  const rawGpsSpeedMps = currentGpsLocation?.speed ?? 0;
  const speedKmh = Math.max(0, rawGpsSpeedMps * 3.6);
  const speedMph = Math.max(0, rawGpsSpeedMps * 2.23694);
  const displaySpeed = speedUnit === 'km/h' ? Math.round(speedKmh) : Math.round(speedMph);

  // Compute Estimated Time of Arrival (ETA)
  const etaDate = new Date(Date.now() + remainingSecs * 1000);
  const etaFormatted = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Voice Guidance (Text-to-Speech)
  useEffect(() => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!currentStep) return;

    const speechText = currentStep.instruction;
    if (speechText && speechText !== lastSpokenStepRef.current) {
      lastSpokenStepRef.current = speechText;
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep?.instruction, isVoiceEnabled]);

  // Clean up speech synthesis and simulation on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, []);

  // Simulation test mode runner (allows verifying turn-by-turn and speedometer while stationary)
  const handleToggleSimulation = () => {
    if (isSimulating) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

      simulationTimerRef.current = setInterval(() => {
        simulationStepRef.current = (simulationStepRef.current + 0.04) % 1.0;
        if (onSimulateMove) {
          onSimulateMove(simulationStepRef.current);
        }
      }, 1200);
    }
  };

  // Turn maneuver icon helper
  const renderManeuverIcon = (modifier?: string, type?: string) => {
    if (type === 'arrive') return <MapPin className="w-5 h-5 text-rose-400" />;
    if (modifier?.includes('slight left')) return <ArrowUpLeft className="w-5 h-5 text-emerald-400" />;
    if (modifier?.includes('slight right')) return <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
    if (modifier?.includes('left')) return <CornerUpLeft className="w-5 h-5 text-emerald-400" />;
    if (modifier?.includes('right')) return <CornerUpRight className="w-5 h-5 text-emerald-400" />;
    return <ArrowUp className="w-5 h-5 text-emerald-400" />;
  };

  const getModeIcon = () => {
    if (travelMode === 'walking') return <Footprints className="w-3.5 h-3.5 text-emerald-400" />;
    if (travelMode === 'cycling') return <Bike className="w-3.5 h-3.5 text-emerald-400" />;
    return <Car className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const getSpeedCategory = () => {
    if (displaySpeed === 0) return 'Stationary';
    if (travelMode === 'walking') return displaySpeed > 6 ? 'Fast Walk' : 'Walking Pace';
    if (travelMode === 'cycling') return displaySpeed > 25 ? 'Fast Ride' : 'Cycling';
    return displaySpeed > 60 ? 'Highway Speed' : 'City Cruising';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[500] flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP FLOATING BAR: Sleek, compact Turn-by-Turn Instruction HUD  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-2 max-w-xl w-full mx-auto pointer-events-auto transition-all duration-300">
        <div className="bg-[#0b1329]/95 backdrop-blur-2xl rounded-2xl p-2.5 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 border border-white/15">
          
          {/* Turn Arrow + Next Instruction Text */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {renderManeuverIcon(currentStep?.maneuverModifier, currentStep?.maneuverType)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {currentStep?.maneuverType === 'arrive' ? 'Arrive at Destination' : 'Next Turn'}
                </span>
                {currentStep?.distanceMeters ? (
                  <span className="text-[10px] font-bold text-slate-200 bg-white/10 px-1.5 py-0.2 rounded border border-white/10 font-mono">
                    in {formatDistance(currentStep.distanceMeters)}
                  </span>
                ) : null}
              </div>

              <p className="text-xs sm:text-sm font-bold text-slate-100 truncate mt-0.5 drop-shadow-sm leading-snug">
                {currentStep?.instruction || 'Follow highlighted safe corridor'}
              </p>

              {nextStep && (
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5 font-light">
                  <span className="text-slate-500 font-medium">Then:</span> {nextStep.instruction}
                </p>
              )}
            </div>
          </div>

          {/* Quick HUD Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 border-l border-white/10 pl-2">
            {/* Voice Guidance Toggle */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                isVoiceEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
              title={isVoiceEnabled ? 'Voice Guidance Active (Click to Mute)' : 'Voice Guidance Muted (Click to Enable)'}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Exit Navigation */}
            <button
              onClick={onExitNavigation}
              className="p-2 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 transition-all shadow-sm flex items-center gap-1 text-xs font-semibold"
              title="Exit Turn-by-Turn Navigation"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Exit</span>
            </button>
          </div>
        </div>

        {/* Off-Route Alert Floating Card (Only when diverged > 85m) */}
        {isOffRoute && (
          <div className="bg-rose-950/90 backdrop-blur-xl border border-rose-400/60 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-rose-100 truncate">
                  {isRecalculating ? "Off route • Recalculating..." : "Off Route Warning"}
                </div>
                <div className="text-[10px] text-rose-200/80 font-light truncate">
                  {progress?.offRouteDistanceMeters ? `~${progress.offRouteDistanceMeters}m away from safe corridor` : 'Diverged from route'}
                </div>
              </div>
            </div>

            <button
              onClick={onRecalculateRoute}
              disabled={isRecalculating}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg border border-rose-400/40 flex items-center gap-1.5 transition-all shrink-0"
            >
              <RotateCw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isRecalculating ? 'Routing...' : 'Reroute'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MIDDLE FLOATING CONTROLS: Recenter button & Speed Simulation   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between w-full pointer-events-none px-1">
        {/* Recenter / Camera Tracking Lock */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            onClick={onRecenter}
            className={`px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl shadow-2xl flex items-center gap-2 transition-all duration-200 border ${
              isFollowingLocation
                ? 'bg-cyan-600/80 text-white border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-[#0b1329]/90 text-slate-200 hover:text-white border-white/20 hover:border-cyan-400/50'
            }`}
            title={isFollowingLocation ? 'Camera is following your live GPS location' : 'Click to Recenter & Follow Location'}
          >
            <LocateFixed className={`w-4 h-4 ${isFollowingLocation ? 'animate-pulse text-cyan-200' : 'text-cyan-400'}`} />
            <span className="text-[11px]">{isFollowingLocation ? 'Tracking Live' : 'Recenter on Me'}</span>
          </button>
        </div>

        {/* Optional Simulation Mode for Testing Stationary Devices */}
        {onSimulateMove && (
          <div className="pointer-events-auto">
            <button
              onClick={handleToggleSimulation}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium backdrop-blur-xl border transition-all flex items-center gap-1.5 shadow-lg ${
                isSimulating
                  ? 'bg-amber-500/25 border-amber-400/50 text-amber-200 animate-pulse'
                  : 'bg-[#0b1329]/80 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="Simulate vehicle or pedestrian movement along the route"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Simulating...' : 'Test Sim'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM FLOATING COCKPIT: Live Speedometer & Trip Telemetry    */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-xl w-full mx-auto pointer-events-auto">
        <div className="bg-[#0b1329]/95 backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.7)] border border-white/15 space-y-2.5">
          
          {/* Main Grid: Speedometer Gauge + Trip Progress Details */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
            
            {/* Speedometer Card (Col 4) */}
            <div className="col-span-4 bg-white/[0.04] border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  <span>Speed</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSpeedUnit(speedUnit === 'km/h' ? 'mph' : 'km/h')}
                  className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/15 hover:bg-cyan-500/25 px-1.5 py-0.5 rounded border border-cyan-500/30 transition-all"
                  title="Switch between km/h and mph"
                >
                  {speedUnit}
                </button>
              </div>

              {/* Large Digital Speed Readout */}
              <div className="my-0.5 flex items-baseline justify-center gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {displaySpeed}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-medium">{speedUnit}</span>
              </div>

              {/* Dynamic Speed Status Badge */}
              <span className="text-[9px] font-mono text-slate-300 truncate max-w-full">
                {getSpeedCategory()}
              </span>
            </div>

            {/* Trip Time & Distance Metrics (Col 8) */}
            <div className="col-span-8 grid grid-cols-2 gap-2">
              {/* Remaining Duration & ETA */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                  Remaining Time
                </span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] mt-0.5">
                  {formatDuration(remainingSecs)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ETA: <strong className="text-slate-200">{etaFormatted}</strong>
                </span>
              </div>

              {/* Remaining Distance & Safety Score */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-col justify-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                  Distance Left
                </span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-100 tracking-tight mt-0.5">
                  {formatDistance(remainingDist)}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{route.safetyScore}/100 Safe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Destination Chip */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[11px] text-slate-300 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-slate-400 text-[10px]">To:</span>
              <span className="font-semibold text-slate-200 truncate">{destinationName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
              {getModeIcon()}
              <span className="capitalize">{travelMode.replace('_', ' ')}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
