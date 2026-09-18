import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  isLocating: boolean;
  error: string | null;
  errorCode: number | null;
  isCalibrated?: boolean;
  calibratedAddress?: string;
  isEstimatedIsp?: boolean;
  isLocked?: boolean;
}

export interface UseCurrentLocationReturn extends LocationState {
  requestLocation: () => void;
  setCalibratedLocation: (coords: { lat: number; lng: number }, addressName?: string) => void;
  clearCalibratedLocation: () => void;
  lockCurrentLocation: () => void;
}

const DEFAULT_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000,
};

const CALIBRATED_STORAGE_KEY = 'saferoute_calibrated_location';

/**
 * Custom React hook for device current-location detection using the native Geolocation API.
 * Uses navigator.geolocation.watchPosition() with enableHighAccuracy: true, maximumAge: 0, timeout: 15000.
 * Updates dynamically whenever the browser/device delivers a refined or updated position.
 */
export function useCurrentLocation(options?: PositionOptions): UseCurrentLocationReturn {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    isLocating: true,
    error: null,
    errorCode: null,
    isCalibrated: false,
    isEstimatedIsp: false,
    isLocked: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const isCalibratedRef = useRef<boolean>(false);

  const setCalibratedLocation = useCallback((coords: { lat: number; lng: number }, addressName?: string) => {
    isCalibratedRef.current = true;
    try {
      localStorage.setItem(
        CALIBRATED_STORAGE_KEY,
        JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          name: addressName || 'Exact Calibrated Location',
        })
      );
    } catch (e) {
      console.warn('Could not save calibrated location to storage:', e);
    }

    setLocation({
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: 5,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      isLocating: false,
      error: null,
      errorCode: null,
      isCalibrated: true,
      calibratedAddress: addressName || 'Exact Calibrated Location',
      isEstimatedIsp: false,
      isLocked: true,
    });
  }, []);

  const clearCalibratedLocation = useCallback(() => {
    isCalibratedRef.current = false;
    try {
      localStorage.removeItem(CALIBRATED_STORAGE_KEY);
    } catch {}
    // Re-trigger fresh geolocation watch
    startWatching();
  }, []);

  const lockCurrentLocation = useCallback(() => {
    if (location.latitude !== null && location.longitude !== null) {
      setCalibratedLocation(
        { lat: location.latitude, lng: location.longitude },
        location.calibratedAddress || '🔒 Locked Accurate Spot'
      );
    }
  }, [location.latitude, location.longitude, location.calibratedAddress, setCalibratedLocation]);

  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        isLocating: false,
        error: 'Geolocation is not supported by your browser.',
        errorCode: -1,
      }));
      return;
    }

    // Ensure only one active watcher exists at any time
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!isCalibratedRef.current) {
      setLocation(prev => ({
        ...prev,
        isLocating: true,
        error: null,
        errorCode: null,
      }));
    }

    const successCallback = (position: GeolocationPosition) => {
      // If user has explicitly calibrated/locked a custom point, do not override
      if (isCalibratedRef.current) {
        return;
      }

      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const rawAccuracy = typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : null;
      const isCoarse = rawAccuracy !== null && rawAccuracy > 200;

      setLocation({
        latitude,
        longitude,
        accuracy: rawAccuracy,
        heading: typeof heading === 'number' && !isNaN(heading) ? heading : null,
        speed: typeof speed === 'number' && !isNaN(speed) ? speed : null,
        timestamp: position.timestamp,
        isLocating: false,
        error: null,
        errorCode: null,
        isCalibrated: false,
        isEstimatedIsp: isCoarse,
        isLocked: false,
      });
    };

    const errorCallback = (err: GeolocationPositionError) => {
      let errorMsg = 'An unknown error occurred while retrieving location.';
      if (err.code === 1) {
        errorMsg = 'Location permission is required to detect your position. Please allow location access in your browser settings.';
      } else if (err.code === 2) {
        errorMsg = 'Unable to determine your location. Please check your device location/GPS settings.';
      } else if (err.code === 3) {
        errorMsg = 'Location request timed out. Retrying high-accuracy detection...';
      }

      console.warn('[Geolocation] Error code:', err.code, errorMsg);

      if (!isCalibratedRef.current) {
        setLocation(prev => ({
          ...prev,
          isLocating: false,
          error: errorMsg,
          errorCode: err.code,
        }));
      }
    };

    const geoOptions: PositionOptions = {
      ...DEFAULT_GEO_OPTIONS,
      ...optionsRef.current,
    };

    try {
      const id = navigator.geolocation.watchPosition(successCallback, errorCallback, geoOptions);
      watchIdRef.current = id;
    } catch (e: any) {
      if (!isCalibratedRef.current) {
        setLocation(prev => ({
          ...prev,
          isLocating: false,
          error: e?.message || 'Failed to initialize geolocation tracking.',
          errorCode: -1,
        }));
      }
    }
  }, []);

  useEffect(() => {
    startWatching();

    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startWatching]);

  return {
    ...location,
    requestLocation: startWatching,
    setCalibratedLocation,
    clearCalibratedLocation,
    lockCurrentLocation,
  };
}
