import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  CommunityReport, 
  Coordinates, 
  GpsLocation,
  NavigationProgress,
  RouteAIExplanation, 
  RouteOption, 
  RoutePreference, 
  SavedRoute, 
  TravelMode 
} from './types';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { 
  fetchCommunityReports, 
  submitCommunityReport, 
  confirmCommunityReport,
  fetchUserSavedRoutes, 
  saveRouteToFirestore, 
  deleteSavedRoute,
  subscribeToAuth, 
  logoutUser 
} from './services/firebase';
import { geocodeAddress, reverseGeocode } from './services/geocoding';
import { calculateRoutes } from './services/routing';
import { rankRoutesByPreference } from './safety/safetyEngine';
import { calculateNavigationProgress } from './services/navigation';
import { getRouteExplanation } from './services/gemini';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { RouteSearchForm } from './components/RouteSearchForm';
import { MapComponent } from './components/MapComponent';
import { RouteCardsList } from './components/RouteCardsList';
import { SafetyDetailPanel } from './components/SafetyDetailPanel';
import { SafetyOverviewCard } from './components/SafetyOverviewCard';
import { NavigationOverlay } from './components/NavigationOverlay';
import { CommunityReportModal } from './components/CommunityReportModal';
import { SavedRoutesDrawer } from './components/SavedRoutesDrawer';
import { AuthModal } from './components/AuthModal';
import { SafetyMethodologyModal } from './components/SafetyMethodologyModal';
import { CommunityFeedView } from './components/CommunityFeedView';
import { LocationCalibrationModal } from './components/LocationCalibrationModal';
import { AlertCircle, ShieldCheck } from 'lucide-react';

const GPS_TRACKING_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000,
};

export default function App() {
  // Navigation tabs: default directly to 'planner' so the map and route tools are immediately accessible
  const [activeTab, setActiveTab] = useState<'planner' | 'landing' | 'community'>('planner');

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Decoupled Locations State
  // 1. Current GPS Location: retrieved directly from browser geolocation API
  // 2. Origin: user's manual selection OR explicit "Use My Current Location"
  // 3. Destination: user's manual destination selection
  const [sourceText, setSourceText] = useState('Victoria Memorial, Kolkata');
  const [originLocation, setOriginLocation] = useState<{ name: string; lat: number; lng: number; isCurrentLocation?: boolean } | null>({
    name: 'Victoria Memorial, Kolkata',
    lat: 22.5448,
    lng: 88.3426,
    isCurrentLocation: false
  });

  const [destText, setDestText] = useState('Howrah Station, Kolkata');
  const [destLocation, setDestLocation] = useState<{ name: string; lat: number; lng: number } | null>({
    name: 'Howrah Station, Kolkata',
    lat: 22.5839,
    lng: 88.3430
  });

  // Coordinates derived for Map rendering (memoized to prevent referential churn in dependencies)
  const sourceCoords = React.useMemo(() => {
    return originLocation ? { lat: originLocation.lat, lng: originLocation.lng } : null;
  }, [originLocation?.lat, originLocation?.lng]);

  const destCoords = React.useMemo(() => {
    return destLocation ? { lat: destLocation.lat, lng: destLocation.lng } : null;
  }, [destLocation?.lat, destLocation?.lng]);

  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [preference, setPreference] = useState<RoutePreference>('safest');

  // Route calculation & selection
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Request ID ref to prevent stale asynchronous route responses from overwriting newer searches
  const routeRequestIdRef = useRef<number>(0);

  // Real Browser GPS Tracking Hook with static options reference
  const {
    latitude: gpsLat,
    longitude: gpsLng,
    accuracy: gpsAccuracy,
    heading: gpsHeading,
    speed: gpsSpeed,
    timestamp: gpsTimestamp,
    isLocating: isGpsLocating,
    error: gpsError,
    requestLocation: retryGpsLocation,
    isCalibrated,
    calibratedAddress,
    isEstimatedIsp,
    isLocked,
    setCalibratedLocation,
    clearCalibratedLocation,
    lockCurrentLocation
  } = useCurrentLocation(GPS_TRACKING_OPTIONS);

  // Calibration Modal and Pinpoint State
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isPinpointCalibrationMode, setIsPinpointCalibrationMode] = useState(false);

  // Live Navigation Mode State
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFollowingLocation, setIsFollowingLocation] = useState(true);
  const [navigationProgress, setNavigationProgress] = useState<NavigationProgress | null>(null);
  const [isRecalculatingNavRoute, setIsRecalculatingNavRoute] = useState(false);
  const [simulatedGps, setSimulatedGps] = useState<GpsLocation | null>(null);

  // Unified GPS Location Object - completely independent from route origin
  const currentGpsLocation: GpsLocation | null = React.useMemo(() => {
    if (simulatedGps) return simulatedGps;
    if (gpsLat === null || gpsLng === null) return null;
    return {
      latitude: gpsLat,
      longitude: gpsLng,
      accuracy: gpsAccuracy,
      heading: gpsHeading,
      speed: gpsSpeed,
      timestamp: gpsTimestamp ?? Date.now(),
      isCalibrated,
      calibratedAddress,
      isEstimatedIsp,
      isLocked
    };
  }, [simulatedGps, gpsLat, gpsLng, gpsAccuracy, gpsHeading, gpsSpeed, gpsTimestamp, isCalibrated, calibratedAddress, isEstimatedIsp, isLocked]);
  const lastRecalcTimeRef = useRef<number>(0);

  // Gemini AI reasoning state
  const [aiExplanation, setAiExplanation] = useState<RouteAIExplanation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Community Reports
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pinReportCoords, setPinReportCoords] = useState<Coordinates | null>(null);

  // Saved Routes
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isSavedRoutesOpen, setIsSavedRoutesOpen] = useState(false);
  const [saveRouteSuccess, setSaveRouteSuccess] = useState<string | null>(null);

  // Methodology modal
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Active route reference
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || (routes.length > 0 ? routes[0] : null);

  // Subscribe to Firebase Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch initial community reports
  useEffect(() => {
    fetchCommunityReports()
      .then((data) => setReports(data))
      .catch((err) => console.warn('Could not load reports:', err));
  }, []);

  // Fetch saved routes when user logs in
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserSavedRoutes(currentUser.uid)
        .then((data) => setSavedRoutes(data))
        .catch((err) => console.warn('Could not load saved routes:', err));
    } else {
      fetchUserSavedRoutes('guest')
        .then((data) => setSavedRoutes(data))
        .catch(() => {});
    }
  }, [currentUser?.uid]);

  // Request Gemini Explanation when selected route changes
  const fetchAiForRoute = useCallback(
    async (route: RouteOption, allRoutes: RouteOption[], mode: TravelMode, pref: RoutePreference) => {
      setIsAiLoading(true);
      try {
        const explanation = await getRouteExplanation(route, allRoutes, mode, pref);
        setAiExplanation(explanation);
      } catch (err) {
        console.warn('AI explanation error:', err);
      } finally {
        setIsAiLoading(false);
      }
    },
    []
  );

  // User edits or selects origin point
  const handleSourceTextChange = (text: string, explicitCoords?: Coordinates) => {
    setSourceText(text);
    if (explicitCoords) {
      setOriginLocation({
        name: text,
        lat: explicitCoords.lat,
        lng: explicitCoords.lng,
        isCurrentLocation: false
      });
    } else {
      // Invalidate previous origin coordinates so it will be resolved anew
      setOriginLocation(null);
    }
    // PREVENT STALE ROUTES: invalidate previous routes immediately
    setRoutes([]);
    setSelectedRouteId(null);
    setAiExplanation(null);
    setRouteError(null);
  };

  // User edits or selects destination point
  const handleDestTextChange = (text: string, explicitCoords?: Coordinates) => {
    setDestText(text);
    if (explicitCoords) {
      setDestLocation({
        name: text,
        lat: explicitCoords.lat,
        lng: explicitCoords.lng
      });
    } else {
      // Invalidate previous destination coordinates
      setDestLocation(null);
    }
    // PREVENT STALE ROUTES: invalidate previous routes immediately
    setRoutes([]);
    setSelectedRouteId(null);
    setAiExplanation(null);
    setRouteError(null);
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const tempText = sourceText;
    const tempOrigin = originLocation;

    setSourceText(destText);
    setOriginLocation(destLocation ? { ...destLocation, isCurrentLocation: false } : null);

    setDestText(tempText);
    setDestLocation(tempOrigin ? { name: tempOrigin.name, lat: tempOrigin.lat, lng: tempOrigin.lng } : null);

    // Invalidate routes immediately on swap
    setRoutes([]);
    setSelectedRouteId(null);
    setAiExplanation(null);
    setRouteError(null);
  };

  // Quick Preset Corridor Selection
  const handleQuickRouteSelect = async (source: string, destination: string) => {
    setActiveTab('planner');
    setSourceText(source);
    setDestText(destination);
    setOriginLocation(null);
    setDestLocation(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setAiExplanation(null);
    setRouteError(null);
    setIsLoadingRoutes(true);

    const currentReqId = ++routeRequestIdRef.current;

    try {
      const [sourceResults, destResults] = await Promise.all([
        geocodeAddress(source.trim()),
        geocodeAddress(destination.trim())
      ]);

      if (currentReqId !== routeRequestIdRef.current) return;

      if (!sourceResults || sourceResults.length === 0 || !destResults || destResults.length === 0) {
        setRouteError('Could not pinpoint coordinates for selected preset.');
        setIsLoadingRoutes(false);
        return;
      }

      const originObj = {
        name: sourceResults[0].name || source,
        lat: sourceResults[0].coordinates.lat,
        lng: sourceResults[0].coordinates.lng,
        isCurrentLocation: false
      };
      const destObj = {
        name: destResults[0].name || destination,
        lat: destResults[0].coordinates.lat,
        lng: destResults[0].coordinates.lng
      };

      setOriginLocation(originObj);
      setDestLocation(destObj);

      const calculated = await calculateRoutes(
        { lat: originObj.lat, lng: originObj.lng },
        { lat: destObj.lat, lng: destObj.lng },
        travelMode,
        preference,
        reports
      );

      if (currentReqId !== routeRequestIdRef.current) return;

      if (!calculated || calculated.length === 0) {
        setRouteError('No traversable routes found between these points.');
        setIsLoadingRoutes(false);
        return;
      }

      const ranked = rankRoutesByPreference(calculated, preference);
      setRoutes(ranked);
      setSelectedRouteId(ranked[0].id);
      fetchAiForRoute(ranked[0], ranked, travelMode, preference);
    } catch (err) {
      console.error('Quick route error:', err);
      setRouteError('Error calculating preset route.');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Handle Finding Routes
  const handleFindSafeRoutes = async (
    customOrigin?: { name: string; lat: number; lng: number; isCurrentLocation?: boolean } | null,
    customDest?: { name: string; lat: number; lng: number } | null,
    overrideMode?: TravelMode,
    overridePref?: RoutePreference
  ) => {
    if (!sourceText.trim() || !destText.trim()) {
      setRouteError('Please enter both origin and destination.');
      return;
    }

    // Increment request ID to prevent older asynchronous API responses from overwriting a newer search
    const currentReqId = ++routeRequestIdRef.current;

    // 1. Clear/invalidate the previous route immediately so old routes do NOT remain visible
    setRoutes([]);
    setSelectedRouteId(null);
    setAiExplanation(null);
    setRouteError(null);
    setIsLoadingRoutes(true);

    try {
      // 2. Resolve origin coordinates
      let resolvedOrigin = customOrigin !== undefined ? customOrigin : originLocation;

      if (!resolvedOrigin || resolvedOrigin.name.toLowerCase() !== sourceText.trim().toLowerCase()) {
        if (sourceText.includes('Current Location') && currentGpsLocation) {
          resolvedOrigin = {
            name: '📍 My Current Location',
            lat: currentGpsLocation.latitude,
            lng: currentGpsLocation.longitude,
            isCurrentLocation: true
          };
        } else {
          const sourceResults = await geocodeAddress(sourceText.trim());
          if (currentReqId !== routeRequestIdRef.current) return; // Stale check

          if (!sourceResults || sourceResults.length === 0) {
            setRouteError(`Could not pinpoint origin "${sourceText}". Please check spelling or select from suggestions.`);
            setIsLoadingRoutes(false);
            return;
          }
          resolvedOrigin = {
            name: sourceResults[0].name || sourceText.trim(),
            lat: sourceResults[0].coordinates.lat,
            lng: sourceResults[0].coordinates.lng,
            isCurrentLocation: false
          };
        }
        setOriginLocation(resolvedOrigin);
      }

      // 3. Resolve destination coordinates
      let resolvedDest = customDest !== undefined ? customDest : destLocation;

      if (!resolvedDest || resolvedDest.name.toLowerCase() !== destText.trim().toLowerCase()) {
        const destResults = await geocodeAddress(destText.trim());
        if (currentReqId !== routeRequestIdRef.current) return; // Stale check

        if (!destResults || destResults.length === 0) {
          setRouteError(`Could not pinpoint destination "${destText}". Please check spelling or select from suggestions.`);
          setIsLoadingRoutes(false);
          return;
        }
        resolvedDest = {
          name: destResults[0].name || destText.trim(),
          lat: destResults[0].coordinates.lat,
          lng: destResults[0].coordinates.lng
        };
        setDestLocation(resolvedDest);
      }

      const modeToUse = overrideMode || travelMode;
      const prefToUse = overridePref || preference;

      // 4. Request the new route using resolved coordinates (e.g. Dankuni coords -> Howrah Station coords)
      const calculated = await calculateRoutes(
        { lat: resolvedOrigin.lat, lng: resolvedOrigin.lng },
        { lat: resolvedDest.lat, lng: resolvedDest.lng },
        modeToUse,
        prefToUse,
        reports
      );

      // Stale check to prevent race condition
      if (currentReqId !== routeRequestIdRef.current) {
        return;
      }

      if (!calculated || calculated.length === 0) {
        setRouteError('No traversable routes found between these two points for the selected travel mode.');
        setIsLoadingRoutes(false);
        return;
      }

      // 5. Render the new route, update distance and duration, safety score
      setRoutes(calculated);
      const topRoute = calculated[0];
      setSelectedRouteId(topRoute.id);
      setActiveTab('planner');

      // 6. Update route explanation
      fetchAiForRoute(topRoute, calculated, modeToUse, prefToUse);
    } catch (err: any) {
      if (currentReqId !== routeRequestIdRef.current) return;
      console.error('Route calculation error:', err);
      setRouteError(err?.message || 'Error occurred while calculating safe routes. Please retry.');
    } finally {
      if (currentReqId === routeRequestIdRef.current) {
        setIsLoadingRoutes(false);
      }
    }
  };

  // Run initial route calculation on mount so map displays default route
  useEffect(() => {
    if (routes.length === 0 && originLocation && destLocation) {
      handleFindSafeRoutes(originLocation, destLocation);
    }
  }, []);

  // When Travel Mode changes, immediately re-calculate routes with the new profile!
  const handleTravelModeChange = (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (originLocation && destLocation) {
      handleFindSafeRoutes(originLocation, destLocation, newMode, preference);
    }
  };

  // Re-rank routes when preference changes: strictly select the top matching route (Safest or Fastest)
  const handlePreferenceChange = (newPref: RoutePreference) => {
    setPreference(newPref);
    if (routes.length > 0) {
      const reRanked = rankRoutesByPreference(routes, newPref);
      setRoutes(reRanked);
      // Strictly select the route corresponding to the preference
      const topRoute = reRanked[0];
      setSelectedRouteId(topRoute.id);
      fetchAiForRoute(topRoute, reRanked, travelMode, newPref);
    }
  };

  // Select Route Handler
  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id);
    const chosen = routes.find((r) => r.id === id);
    if (chosen) {
      fetchAiForRoute(chosen, routes, travelMode, preference);
    }
  };

  // Explicit "Use My Current Location" button handler
  const handleUseCurrentLocation = async () => {
    if (currentGpsLocation) {
      const locationLabel = isCalibrated ? (calibratedAddress || '🎯 My Calibrated Location') : '📍 My Current Location';
      const gpsOrigin = {
        name: locationLabel,
        lat: currentGpsLocation.latitude,
        lng: currentGpsLocation.longitude,
        isCurrentLocation: true
      };
      setSourceText(locationLabel);
      setOriginLocation(gpsOrigin);

      // Invalidate previous routes
      setRoutes([]);
      setSelectedRouteId(null);
      setAiExplanation(null);
      setRouteError(null);

      // Immediately request route from user's current GPS location
      handleFindSafeRoutes(gpsOrigin, destLocation);
    } else {
      retryGpsLocation();
      if (gpsError) {
        setIsCalibrationModalOpen(true);
      } else {
        alert('Detecting your GPS location. You can also calibrate your exact pinpoint on the map.');
      }
    }
  };

  // Calibration handlers
  const handleCalibrateLocation = (coords: Coordinates, addressName?: string) => {
    setCalibratedLocation(coords, addressName);
    setIsPinpointCalibrationMode(false);
    
    // If the origin is currently set to current location, auto-update origin to the calibrated point
    if (originLocation?.isCurrentLocation) {
      const name = addressName || '🎯 Calibrated Origin';
      const newOrigin = {
        name,
        lat: coords.lat,
        lng: coords.lng,
        isCurrentLocation: true
      };
      setSourceText(name);
      setOriginLocation(newOrigin);
      handleFindSafeRoutes(newOrigin, destLocation);
    }
  };

  const handleClearCalibration = () => {
    clearCalibratedLocation();
    setIsPinpointCalibrationMode(false);
  };

  const handleCalibrateMapClick = (coords: Coordinates) => {
    handleCalibrateLocation(coords, '🎯 Custom Map Pinpoint');
  };

  // --------------------------------------------------------------------------
  // NAVIGATION MODE IMPLEMENTATION
  // --------------------------------------------------------------------------

  // Start Navigation
  const handleStartNavigation = () => {
    if (!selectedRoute) return;

    setIsNavigating(true);
    setIsFollowingLocation(true);

    // Initial position fallback to live GPS or start of route
    const initialCoords = currentGpsLocation
      ? { lat: currentGpsLocation.latitude, lng: currentGpsLocation.longitude }
      : { lat: selectedRoute.coordinates[0][0], lng: selectedRoute.coordinates[0][1] };

    const initialProgress = calculateNavigationProgress(initialCoords, selectedRoute, travelMode);
    setNavigationProgress(initialProgress);
  };

  // Exit Navigation
  const handleExitNavigation = () => {
    setIsNavigating(false);
    setNavigationProgress(null);
    setIsFollowingLocation(false);
    setSimulatedGps(null);
  };

  // Simulate movement along route for live navigation and speedometer testing
  const handleSimulateMove = (ratio: number) => {
    if (!selectedRoute || selectedRoute.coordinates.length < 2) return;
    const coords = selectedRoute.coordinates;
    const totalPoints = coords.length;
    const targetIdx = Math.min(totalPoints - 1, Math.floor(ratio * totalPoints));
    const [lat, lng] = coords[targetIdx];

    // Determine simulation speed based on travel mode
    let simSpeedMps = 1.35; // ~4.8 km/h walking
    if (travelMode === 'cycling') simSpeedMps = 5.2; // ~18.7 km/h
    if (travelMode === 'two_wheeler' || travelMode === 'car') simSpeedMps = 11.5; // ~41.4 km/h

    // Calculate heading towards next coordinate
    let heading: number | null = null;
    if (targetIdx < totalPoints - 1) {
      const nextP = coords[targetIdx + 1];
      const y = Math.sin((nextP[1] - lng) * Math.PI / 180) * Math.cos(nextP[0] * Math.PI / 180);
      const x = Math.cos(lat * Math.PI / 180) * Math.sin(nextP[0] * Math.PI / 180) -
                Math.sin(lat * Math.PI / 180) * Math.cos(nextP[0] * Math.PI / 180) * Math.cos((nextP[1] - lng) * Math.PI / 180);
      heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    const simLocation: GpsLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 6,
      heading,
      speed: simSpeedMps,
      timestamp: Date.now(),
      isCalibrated: false,
      isEstimatedIsp: false,
      isLocked: false
    };

    setSimulatedGps(simLocation);
    const newProg = calculateNavigationProgress({ lat, lng }, selectedRoute, travelMode);
    setNavigationProgress(newProg);
  };

  // Recalculate Route while navigating (Off-route recovery)
  const handleRecalculateRoute = async (customStartCoords?: Coordinates) => {
    const startPoint = customStartCoords || (currentGpsLocation ? { lat: currentGpsLocation.latitude, lng: currentGpsLocation.longitude } : null);
    if (!startPoint || !destCoords || isRecalculatingNavRoute) return;

    const now = Date.now();
    // Throttle automatic recalculation requests to protect routing service
    if (!customStartCoords && now - lastRecalcTimeRef.current < 4000) return;
    lastRecalcTimeRef.current = now;

    setIsRecalculatingNavRoute(true);
    try {
      const newRoutes = await calculateRoutes(startPoint, destCoords, travelMode, preference, reports);
      if (newRoutes && newRoutes.length > 0) {
        setRoutes(newRoutes);
        // Strictly select route matching user's preference (e.g. safest route stays top route)
        const topRoute = newRoutes[0];
        setSelectedRouteId(topRoute.id);
        const newProg = calculateNavigationProgress(startPoint, topRoute, travelMode);
        setNavigationProgress(newProg);
      }
    } catch (err) {
      console.warn('Recalculation error:', err);
    } finally {
      setIsRecalculatingNavRoute(false);
    }
  };

  // Continuously update navigation progress as live GPS coordinates change
  useEffect(() => {
    if (!isNavigating || !selectedRoute || !currentGpsLocation) return;

    const userCoords = { lat: currentGpsLocation.latitude, lng: currentGpsLocation.longitude };
    const prog = calculateNavigationProgress(userCoords, selectedRoute, travelMode);
    setNavigationProgress(prog);

    // Off-route detection: if user diverges > 85m from safe corridor, trigger recalculation
    if (prog.isOffRoute && !isRecalculatingNavRoute && destCoords) {
      const now = Date.now();
      if (now - lastRecalcTimeRef.current > 5000) {
        handleRecalculateRoute(userCoords);
      }
    }
  }, [
    isNavigating,
    selectedRoute,
    travelMode,
    currentGpsLocation?.latitude,
    currentGpsLocation?.longitude,
    destCoords?.lat,
    destCoords?.lng,
    isRecalculatingNavRoute
  ]);

  // Submit Community Report
  const handleSubmitReport = async (data: {
    category: any;
    description: string;
    latitude: number;
    longitude: number;
  }) => {
    if (!currentUser) {
      setIsReportModalOpen(false);
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to submit community reports to Firestore.');
    }

    const report = await submitCommunityReport({
      ...data,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Community Contributor',
      status: 'Reported'
    });

    setReports((prev) => [report, ...prev]);

    // Recalculate routes if any active routes exist near this new hazard
    if (sourceCoords && destCoords && routes.length > 0) {
      calculateRoutes(sourceCoords, destCoords, travelMode, preference, [report, ...reports])
        .then((updated) => setRoutes(updated))
        .catch(() => {});
    }
  };

  // Confirm Community Report
  const handleConfirmReport = async (reportId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await confirmCommunityReport(reportId);
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, confirmations: r.confirmations + 1, status: 'Community Confirmed' } : r
      )
    );
  };

  // Save Route
  const handleSaveRoute = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedRoute || !sourceCoords || !destCoords) return;

    try {
      const saved = await saveRouteToFirestore(currentUser.uid, {
        source: sourceText,
        destination: destText,
        sourceCoords,
        destCoords,
        travelMode,
        routePreference: preference,
        distance: `${selectedRoute.distanceKm} km`,
        duration: selectedRoute.durationFormatted,
        safetyScore: selectedRoute.safetyScore
      });

      setSavedRoutes((prev) => [saved, ...prev]);
      setSaveRouteSuccess('Route successfully saved to Firestore!');
      setTimeout(() => setSaveRouteSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save route error:', err);
      alert('Could not save route: ' + (err?.message || 'Database error'));
    }
  };

  // Load Saved Route back into planner
  const handleLoadSavedRoute = (saved: SavedRoute) => {
    setSourceText(saved.source);
    setOriginLocation({
      name: saved.source,
      lat: saved.sourceCoords.lat,
      lng: saved.sourceCoords.lng,
      isCurrentLocation: false
    });
    setDestText(saved.destination);
    setDestLocation({
      name: saved.destination,
      lat: saved.destCoords.lat,
      lng: saved.destCoords.lng
    });
    setTravelMode(saved.travelMode);
    setPreference(saved.routePreference);
    setActiveTab('planner');

    setIsLoadingRoutes(true);
    calculateRoutes(saved.sourceCoords, saved.destCoords, saved.travelMode, saved.routePreference, reports)
      .then((calc) => {
        setRoutes(calc);
        if (calc.length > 0) {
          setSelectedRouteId(calc[0].id);
          fetchAiForRoute(calc[0], calc, saved.travelMode, saved.routePreference);
        }
      })
      .finally(() => setIsLoadingRoutes(false));
  };

  // Delete Saved Route
  const handleDeleteSavedRoute = async (id: string) => {
    await deleteSavedRoute(id, currentUser?.uid || 'guest');
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // Map click to report hazard
  const handleMapClickToReport = (coords: Coordinates) => {
    setPinReportCoords(coords);
    setIsReportModalOpen(true);
  };

  const isCurrentRouteSaved = selectedRoute
    ? savedRoutes.some(
        (r) => r.source === sourceText && r.destination === destText && r.safetyScore === selectedRoute.safetyScore
      )
    : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={logoutUser}
        onOpenSavedRoutes={() => setIsSavedRoutesOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenReportModal={() => {
          setPinReportCoords(sourceCoords || { lat: 22.5448, lng: 88.3426 });
          setIsReportModalOpen(true);
        }}
        savedRoutesCount={savedRoutes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'landing' ? (
          <LandingHero
            onStartPlanning={() => {
              setActiveTab('planner');
              if (routes.length === 0) {
                handleFindSafeRoutes();
              }
            }}
            onQuickRouteSelect={handleQuickRouteSelect}
          />
        ) : activeTab === 'community' ? (
          <CommunityFeedView
            reports={reports}
            onConfirmReport={handleConfirmReport}
            onOpenSubmitModal={() => {
              setPinReportCoords(sourceCoords || { lat: 22.5448, lng: 88.3426 });
              setIsReportModalOpen(true);
            }}
            onFocusReportOnMap={(rep) => {
              setActiveTab('planner');
              setOriginLocation({
                name: rep.category + ' Hazard',
                lat: rep.latitude,
                lng: rep.longitude,
                isCurrentLocation: false
              });
              setSourceText(rep.category + ' Hazard');
            }}
          />
        ) : (
          /* Route Planner - Map & Safety Intelligence Interface */
          <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden">
            {/* Left Column: Route Search Form & Route Alternatives Cards (Hidden during active turn-by-turn navigation) */}
            {!isNavigating && (
              <div
                className="w-full lg:w-[380px] xl:w-[420px] border-r border-white/[0.08] bg-[#050814]/95 backdrop-blur-xl flex flex-col h-auto lg:h-full shrink-0 overflow-y-auto p-4 space-y-4 shadow-xl z-20"
              >
                {/* Route Search Form */}
                <RouteSearchForm
                  sourceText={sourceText}
                  setSourceText={handleSourceTextChange}
                  destText={destText}
                  setDestText={handleDestTextChange}
                  travelMode={travelMode}
                  setTravelMode={handleTravelModeChange}
                  preference={preference}
                  setPreference={handlePreferenceChange}
                  onSearch={() => handleFindSafeRoutes()}
                  isLoading={isLoadingRoutes}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  onSwap={handleSwapLocations}
                  onSelectSourceSuggestion={(item) => handleSourceTextChange(item)}
                  onSelectDestSuggestion={(item) => handleDestTextChange(item)}
                  isCalibrated={isCalibrated}
                  isEstimatedIsp={isEstimatedIsp}
                  isLocked={isLocked}
                  onOpenCalibrationModal={() => setIsCalibrationModalOpen(true)}
                  onLockLocation={lockCurrentLocation}
                  onUnlockLocation={clearCalibratedLocation}
                />

                {/* Route Error Notification */}
                {routeError && (
                  <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2 shadow-lg">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{routeError}</span>
                  </div>
                )}

                {/* Save Route Success Feedback */}
                {saveRouteSuccess && (
                  <div className="bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 rounded-xl p-3 text-xs flex items-center gap-2 shadow-lg animate-fade-in font-medium">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{saveRouteSuccess}</span>
                  </div>
                )}

                {/* Evaluated Route Alternatives List */}
                {routes.length > 0 ? (
                  <RouteCardsList
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={handleSelectRoute}
                  />
                ) : (
                  <div className="glass-card rounded-2xl p-4 text-center text-slate-400 space-y-2 border border-white/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200">Ready to Calculate Safety Corridors</div>
                    <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                      Enter any origin and destination above to compare live safety ratings out of 100 with street-level telemetry.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Right Main Area: Map Stage + Safety Detail Analytics */}
            <div className={`flex-1 flex flex-col h-full ${isNavigating ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#050814]`}>
              {/* Map Stage: Fullscreen in navigation mode, standard split view otherwise */}
              <div
                className={`w-full relative overflow-hidden transition-all duration-300 ${
                  isNavigating
                    ? 'flex-1 h-full min-h-0 z-10'
                    : 'h-[360px] sm:h-[400px] lg:h-[48vh] xl:h-[50vh] shrink-0 border-b border-white/[0.08] shadow-lg'
                }`}
              >
                <MapComponent
                  sourceCoords={sourceCoords}
                  destCoords={destCoords}
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={handleSelectRoute}
                  reports={reports}
                  onMapClickToReport={handleMapClickToReport}
                  isReportingMode={isReportModalOpen}
                  isNavigating={isNavigating}
                  currentGpsCoords={currentGpsLocation ? { lat: currentGpsLocation.latitude, lng: currentGpsLocation.longitude } : null}
                  currentGpsLocation={currentGpsLocation}
                  isFollowingLocation={isFollowingLocation}
                  onUserManualPan={() => setIsFollowingLocation(false)}
                  onMyLocationClick={() => {
                    if (isNavigating) {
                      setIsFollowingLocation(true);
                    }
                  }}
                  gpsError={gpsError}
                  onRetryGps={retryGpsLocation}
                  isPinpointCalibrationMode={isPinpointCalibrationMode}
                  onCalibrateMapClick={handleCalibrateMapClick}
                  onOpenCalibrationModal={() => setIsCalibrationModalOpen(true)}
                  onClearCalibration={handleClearCalibration}
                  onCancelPinpointMode={() => setIsPinpointCalibrationMode(false)}
                  onLockLocation={lockCurrentLocation}
                  onUnlockLocation={clearCalibratedLocation}
                  isLocked={isLocked}
                />

                {/* Live Navigation Overlay & HUD */}
                {isNavigating && selectedRoute && (
                  <NavigationOverlay
                    route={selectedRoute}
                    travelMode={travelMode}
                    destinationName={destText}
                    progress={navigationProgress}
                    currentGpsLocation={currentGpsLocation}
                    isFollowingLocation={isFollowingLocation}
                    onExitNavigation={handleExitNavigation}
                    onRecenter={() => setIsFollowingLocation(true)}
                    onRecalculateRoute={() => handleRecalculateRoute()}
                    isRecalculating={isRecalculatingNavRoute}
                    onSimulateMove={handleSimulateMove}
                  />
                )}
              </div>

              {/* Bottom Wide Section: Full-Width Safety Factor Breakdown (Hidden during active navigation) */}
              {!isNavigating && (
                <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-5">
                  {selectedRoute ? (
                    <SafetyDetailPanel
                      route={selectedRoute}
                      travelMode={travelMode}
                      preference={preference}
                      aiExplanation={aiExplanation}
                      isAiLoading={isAiLoading}
                      onRefreshAi={() => fetchAiForRoute(selectedRoute, routes, travelMode, preference)}
                      onSaveRoute={handleSaveRoute}
                      isRouteSaved={isCurrentRouteSaved}
                      onOpenMethodology={() => setIsMethodologyOpen(true)}
                      onStartNavigation={handleStartNavigation}
                    />
                  ) : (
                    <SafetyOverviewCard
                      reports={reports}
                      onSelectQuickRoute={handleQuickRouteSelect}
                      onOpenMethodology={() => setIsMethodologyOpen(true)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <CommunityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSubmitReport}
        initialCoords={pinReportCoords}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIsReportModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <SavedRoutesDrawer
        isOpen={isSavedRoutesOpen}
        onClose={() => setIsSavedRoutesOpen(false)}
        savedRoutes={savedRoutes}
        onLoadRoute={handleLoadSavedRoute}
        onDeleteRoute={handleDeleteSavedRoute}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // session updated automatically via onAuthStateChanged
        }}
      />

      <SafetyMethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      <LocationCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        currentCoords={currentGpsLocation ? { lat: currentGpsLocation.latitude, lng: currentGpsLocation.longitude } : null}
        isCalibrated={isCalibrated}
        calibratedAddress={calibratedAddress}
        onCalibrateLocation={handleCalibrateLocation}
        onClearCalibration={handleClearCalibration}
        onTriggerPinpointMode={() => {
          setIsCalibrationModalOpen(false);
          setIsPinpointCalibrationMode(true);
        }}
      />
    </div>
  );
}
