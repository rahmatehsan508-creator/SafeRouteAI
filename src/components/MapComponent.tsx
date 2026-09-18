import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CommunityReport, Coordinates, GpsLocation, RouteOption } from '../types';
import { Locate, AlertTriangle, RotateCcw, Crosshair, Check, X, Lock, Unlock, Shield } from 'lucide-react';

interface MapComponentProps {
  sourceCoords: Coordinates | null;
  destCoords: Coordinates | null;
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  reports: CommunityReport[];
  onMapClickToReport?: (coords: Coordinates) => void;
  isReportingMode?: boolean;
  isNavigating?: boolean;
  currentGpsCoords?: Coordinates | null; // Compatibility with legacy coordinates
  currentGpsLocation?: GpsLocation | null; // Full real GPS data
  isFollowingLocation?: boolean;
  onUserManualPan?: () => void;
  onMyLocationClick?: () => void;
  gpsError?: string | null;
  onRetryGps?: () => void;
  isPinpointCalibrationMode?: boolean;
  onCalibrateMapClick?: (coords: Coordinates) => void;
  onOpenCalibrationModal?: () => void;
  onCancelCalibrationMode?: () => void;
  onLockLocation?: () => void;
  onUnlockLocation?: () => void;
  isLocked?: boolean;
}

/**
 * Creates HTML string for the GPS location indicator.
 * Displays a distinctive blue circular marker with pulsing halo,
 * and an directional cone/arrow when heading information is available from the device.
 */
function createGpsMarkerHtml(heading: number | null, isCalibrated?: boolean): string {
  const hasHeading = heading !== null && !isNaN(heading);

  if (isCalibrated) {
    return `
      <div class="relative w-12 h-12 flex items-center justify-center pointer-events-none select-none">
        <div class="absolute w-10 h-10 rounded-full bg-cyan-500/30 animate-ping"></div>
        <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30"></div>
        <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-2xl flex items-center justify-center z-10 border-2 border-white ring-2 ring-cyan-400/50">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;
  }

  if (hasHeading) {
    return `
      <div class="relative w-11 h-11 flex items-center justify-center pointer-events-none select-none">
        <!-- Direction cone beam rotated to match heading -->
        <div style="transform: rotate(${heading}deg); transform-origin: center center;" class="absolute inset-0 flex items-start justify-center">
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[14px] border-b-blue-600 drop-shadow-md -mt-1"></div>
        </div>
        <!-- Pulsing radar ring -->
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping"></div>
        <!-- Center dot casing -->
        <div class="w-5 h-5 rounded-full bg-white shadow-xl flex items-center justify-center z-10 border border-blue-200">
          <div class="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-inner"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="relative w-11 h-11 flex items-center justify-center pointer-events-none select-none">
      <!-- Pulsing radar ring -->
      <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
      <!-- Semi-transparent halo -->
      <div class="absolute w-6 h-6 rounded-full bg-blue-400/30"></div>
      <!-- Center dot casing -->
      <div class="w-5 h-5 rounded-full bg-white shadow-xl flex items-center justify-center z-10 border border-blue-200">
        <div class="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-inner"></div>
      </div>
    </div>
  `;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  sourceCoords,
  destCoords,
  routes,
  selectedRouteId,
  onSelectRoute,
  reports,
  onMapClickToReport,
  isReportingMode = false,
  isNavigating = false,
  currentGpsCoords = null,
  currentGpsLocation = null,
  isFollowingLocation = false,
  onUserManualPan,
  onMyLocationClick,
  gpsError = null,
  onRetryGps,
  isPinpointCalibrationMode = false,
  onCalibrateMapClick,
  onOpenCalibrationModal,
  onCancelCalibrationMode,
  onLockLocation,
  onUnlockLocation,
  isLocked = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Persistent refs for smooth GPS marker updating without re-rendering layers
  const userGpsMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const hasCenteredInitiallyRef = useRef<boolean>(false);
  const prevNavigatingRef = useRef<boolean>(false);

  // Resolve active GPS coordinates
  const activeGpsLat = currentGpsLocation?.latitude ?? currentGpsCoords?.lat ?? null;
  const activeGpsLng = currentGpsLocation?.longitude ?? currentGpsCoords?.lng ?? null;
  const activeAccuracy = currentGpsLocation?.accuracy ?? null;
  const activeHeading = currentGpsLocation?.heading ?? null;
  const isCalibrated = currentGpsLocation?.isCalibrated ?? false;

  // Smooth Zoom-In on Navigation Start
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isNavigating && !prevNavigatingRef.current) {
      // Zoom into street level (zoom 18) focused on user location or origin
      const targetLat = activeGpsLat ?? sourceCoords?.lat ?? (routes.find(r => r.id === selectedRouteId)?.coordinates[0][0] || routes[0]?.coordinates[0][0]);
      const targetLng = activeGpsLng ?? sourceCoords?.lng ?? (routes.find(r => r.id === selectedRouteId)?.coordinates[0][1] || routes[0]?.coordinates[0][1]);

      if (targetLat && targetLng) {
        setTimeout(() => {
          map.invalidateSize();
          map.flyTo([targetLat, targetLng], 18, {
            animate: true,
            duration: 1.0,
            easeLinearity: 0.25
          });
        }, 100);
      }
    }
    prevNavigatingRef.current = isNavigating;
  }, [isNavigating, activeGpsLat, activeGpsLng, sourceCoords, routes, selectedRouteId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Victoria Memorial, Kolkata [22.5448, 88.3426] or user's active GPS if available
      const initialLat = activeGpsLat || sourceCoords?.lat || 22.5448;
      const initialLng = activeGpsLng || sourceCoords?.lng || 88.3426;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true
      });

      // Standard OpenStreetMap Tile Layer with correct attribution
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom positioned zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Detect manual map panning to stop auto-following location in navigation mode
      map.on('dragstart', () => {
        if (onUserManualPan) {
          onUserManualPan();
        }
      });

      // Layer groups for organized lifecycle
      polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      reportsLayerGroupRef.current = L.layerGroup().addTo(map);
      gpsLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size on next ticks to ensure tiles render when container geometry settles
      const t1 = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 250);
      const t3 = setTimeout(() => map.invalidateSize(), 600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // ResizeObserver to handle container flex / sidebar transitions
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle map resizing whenever navigating or route selection changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [isNavigating, selectedRouteId, routes.length]);

  // Handle map clicks (Reporting incident OR Pinpoint Calibration)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPinpointCalibrationMode && onCalibrateMapClick) {
        onCalibrateMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }

      if (onMapClickToReport) {
        onMapClickToReport({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPinpointCalibrationMode, onCalibrateMapClick, onMapClickToReport]);

  // Update Source & Destination Markers
  useEffect(() => {
    const markersGroup = markersLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    if (sourceCoords && !isNavigating) {
      const sourceIcon = L.divIcon({
        className: 'custom-source-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([sourceCoords.lat, sourceCoords.lng], { icon: sourceIcon })
        .bindPopup(`
          <div class="font-sans text-xs text-slate-800 p-1">
            <strong class="text-emerald-700 font-semibold block text-sm">Origin (Source)</strong>
            <span>Lat: ${sourceCoords.lat.toFixed(4)}, Lng: ${sourceCoords.lng.toFixed(4)}</span>
          </div>
        `)
        .addTo(markersGroup);
    }

    if (destCoords) {
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              B
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .bindPopup(`
          <div class="font-sans text-xs text-slate-800 p-1">
            <strong class="text-rose-700 font-semibold block text-sm">Destination</strong>
            <span>Lat: ${destCoords.lat.toFixed(4)}, Lng: ${destCoords.lng.toFixed(4)}</span>
          </div>
        `)
        .addTo(markersGroup);
    }
  }, [sourceCoords, destCoords, isNavigating]);

  // --------------------------------------------------------------------------
  // LIVE GPS LOCATION & ACCURACY CIRCLE UPDATE (Both normal and navigation modes)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const gpsGroup = gpsLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!gpsGroup || !map) return;

    if (activeGpsLat === null || activeGpsLng === null) {
      // Remove markers if location is no longer available
      if (userGpsMarkerRef.current) {
        gpsGroup.removeLayer(userGpsMarkerRef.current);
        userGpsMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        gpsGroup.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    // Leaflet requires [latitude, longitude]
    const latLng = L.latLng(activeGpsLat, activeGpsLng);

    // 1. Update or create GPS accuracy circle
    if (activeAccuracy && activeAccuracy > 0 && !isCalibrated) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle(latLng, {
          radius: activeAccuracy,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          weight: 1.5,
          interactive: false
        }).addTo(gpsGroup);
      } else {
        userAccuracyCircleRef.current.setLatLng(latLng);
        userAccuracyCircleRef.current.setRadius(activeAccuracy);
      }
    } else if (userAccuracyCircleRef.current) {
      gpsGroup.removeLayer(userAccuracyCircleRef.current);
      userAccuracyCircleRef.current = null;
    }

    // 2. Update or create dedicated GPS Position Marker with direction indicator
    const headingHasChanged = lastHeadingRef.current !== activeHeading;

    if (!userGpsMarkerRef.current || headingHasChanged) {
      if (userGpsMarkerRef.current) {
        gpsGroup.removeLayer(userGpsMarkerRef.current);
      }

      const iconHtml = createGpsMarkerHtml(activeHeading, isCalibrated);
      const gpsIcon = L.divIcon({
        className: 'custom-gps-user-marker',
        html: iconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      userGpsMarkerRef.current = L.marker(latLng, {
        icon: gpsIcon,
        zIndexOffset: 2000,
        interactive: true,
        draggable: false
      }).addTo(gpsGroup);

      const tooltipText = isCalibrated 
        ? `🎯 Exact Calibrated Location` 
        : `Your Live Location (Wi-Fi / Cell GPS${activeAccuracy ? ` · ±${Math.round(activeAccuracy)}m` : ''})`;
      
      userGpsMarkerRef.current.bindTooltip(tooltipText, {
        direction: 'top',
        offset: [0, -14]
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #0f172a; line-height: 1.5; min-width: 180px;">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #06b6d4; display: inline-block;"></span>
            <span>${isCalibrated ? '🎯 Calibrated Spot' : 'Live Detected Location'}</span>
          </div>
          <div><strong>Latitude:</strong> ${activeGpsLat.toFixed(6)}</div>
          <div><strong>Longitude:</strong> ${activeGpsLng.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> ${isCalibrated ? 'Exact' : activeAccuracy !== null ? `±${Math.round(activeAccuracy)} meters (Wi-Fi / Cell)` : 'Detecting...'}</div>
        </div>
      `;
      userGpsMarkerRef.current.bindPopup(popupHtml);

      lastHeadingRef.current = activeHeading;
    } else {
      // Smoothly update position without destroying marker or causing re-render
      userGpsMarkerRef.current.setLatLng(latLng);
      const tooltipText = isCalibrated 
        ? `🎯 Exact Calibrated Location` 
        : `Your Live Location (Wi-Fi / Cell GPS${activeAccuracy ? ` · ±${Math.round(activeAccuracy)}m` : ''})`;
      userGpsMarkerRef.current.setTooltipContent(tooltipText);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #0f172a; line-height: 1.5; min-width: 180px;">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #06b6d4; display: inline-block;"></span>
            <span>${isCalibrated ? '🎯 Calibrated Spot' : 'Live Detected Location'}</span>
          </div>
          <div><strong>Latitude:</strong> ${activeGpsLat.toFixed(6)}</div>
          <div><strong>Longitude:</strong> ${activeGpsLng.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> ${isCalibrated ? 'Exact' : activeAccuracy !== null ? `±${Math.round(activeAccuracy)} meters (Wi-Fi / Cell)` : 'Detecting...'}</div>
        </div>
      `;
      userGpsMarkerRef.current.setPopupContent(popupHtml);
    }

    // 3. Navigation Mode Follow or Initial Map Center
    if (isNavigating && isFollowingLocation) {
      // In navigation mode with follow enabled, smoothly pan the map to keep user centered
      map.panTo(latLng, { animate: true, duration: 0.6 });
    } else if (!hasCenteredInitiallyRef.current && routes.length === 0 && !sourceCoords && !destCoords) {
      // Center map on user once if no existing route or pins exist
      hasCenteredInitiallyRef.current = true;
      map.setView(latLng, 16, { animate: true });
    }
  }, [activeGpsLat, activeGpsLng, activeAccuracy, activeHeading, isCalibrated, isNavigating, isFollowingLocation, routes.length, sourceCoords, destCoords]);

  // Update Route Polylines and Selection Highlighting
  useEffect(() => {
    const polylinesGroup = polylinesLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!polylinesGroup || !map) return;

    polylinesGroup.clearLayers();

    if (routes.length === 0) return;

    // Render non-selected routes first (underneath), then selected route on top
    const sortedRoutes = [...routes].sort((a, b) => {
      if (a.id === selectedRouteId) return 1;
      if (b.id === selectedRouteId) return -1;
      return 0;
    });

    let selectedLatLngs: L.LatLng[] = [];

    sortedRoutes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const latLngs = route.coordinates.map(([lat, lng]) => L.latLng(lat, lng));

      if (isSelected) {
        selectedLatLngs = latLngs;
      }

      // If navigating, only show the selected route prominently and hide/dim alternatives
      if (isNavigating && !isSelected) {
        return;
      }

      // Color scheme based on safety score and selection
      let strokeColor = '#059669'; // Emerald default for high safety (80+)
      if (route.safetyScore < 65) {
        strokeColor = '#e11d48'; // Rose for caution (<65)
      } else if (route.safetyScore < 80) {
        strokeColor = '#d97706'; // Amber for moderate safety (65-79)
      }

      // Outer casing for selected route
      if (isSelected) {
        L.polyline(latLngs, {
          color: '#ffffff',
          weight: 10,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(polylinesGroup);
      }

      const polyline = L.polyline(latLngs, {
        color: isSelected ? strokeColor : '#94a3b8',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1.0 : 0.4,
        dashArray: isSelected ? undefined : '5, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(polylinesGroup);

      // Interactive click to select route
      polyline.on('click', () => {
        if (!isNavigating && !isPinpointCalibrationMode) {
          onSelectRoute(route.id);
        }
      });

      polyline.bindTooltip(
        `
        <div class="text-xs font-sans">
          <div class="font-bold">${route.name}</div>
          <div>Safety Score: <strong>${route.safetyScore}/100</strong> &bull; ${route.durationFormatted}</div>
        </div>
      `,
        { sticky: true }
      );
    });

    // Auto-fit bounds strictly to the selected route if present and not currently navigating
    if (selectedLatLngs.length > 0 && !isNavigating) {
      const bounds = L.latLngBounds(selectedLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [routes, selectedRouteId, onSelectRoute, isNavigating, isPinpointCalibrationMode]);

  // Update Community Report Markers
  useEffect(() => {
    const reportsGroup = reportsLayerGroupRef.current;
    if (!reportsGroup) return;

    reportsGroup.clearLayers();

    reports.forEach((rep) => {
      let iconColor = 'bg-amber-500';
      if (rep.category === 'Reported Incident') iconColor = 'bg-rose-600';
      if (rep.category === 'Poor Lighting') iconColor = 'bg-indigo-600';
      if (rep.category === 'Isolated Area') iconColor = 'bg-purple-600';

      const reportIcon = L.divIcon({
        className: 'custom-report-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full ${iconColor} border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
              !
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const popupHtml = `
        <div class="font-sans text-xs text-slate-800 p-1">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full ${iconColor}"></span>
            <strong class="font-semibold">${rep.category}</strong>
          </div>
          <p class="text-slate-600 text-[11px] mb-1">${rep.description}</p>
          <div class="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-1">
            <span>Status: ${rep.status}</span>
            <span>${rep.confirmations} confirmed</span>
          </div>
        </div>
      `;

      L.marker([rep.latitude, rep.longitude], { icon: reportIcon })
        .bindPopup(popupHtml)
        .addTo(reportsGroup);
    });
  }, [reports]);

  // Recenter Route bounds
  const handleRecenterRoute = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routes.length > 0 && selectedRouteId) {
      const selected = routes.find((r) => r.id === selectedRouteId);
      if (selected && selected.coordinates.length > 0) {
        const bounds = L.latLngBounds(selected.coordinates.map(([lat, lng]) => L.latLng(lat, lng)));
        map.fitBounds(bounds, { padding: [50, 50] });
        return;
      }
    }

    if (sourceCoords && destCoords) {
      const bounds = L.latLngBounds([
        [sourceCoords.lat, sourceCoords.lng],
        [destCoords.lat, destCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
      return;
    }

    if (sourceCoords) {
      map.setView([sourceCoords.lat, sourceCoords.lng], 14);
    }
  };

  // Dedicated "My Location" handler
  const handleCenterOnMyLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeGpsLat !== null && activeGpsLng !== null) {
      map.setView([activeGpsLat, activeGpsLng], 17, { animate: true });
      if (onMyLocationClick) {
        onMyLocationClick();
      }
    } else {
      if (onRetryGps) {
        onRetryGps();
      }
      if (gpsError) {
        alert(gpsError);
      } else {
        alert('Detecting your GPS location. Please ensure location services and browser permissions are allowed.');
      }
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col ${isPinpointCalibrationMode ? 'ring-2 ring-cyan-400 cursor-crosshair' : ''}`}>
      {/* Map DOM Element */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 min-h-[500px] z-0"
        style={{ minHeight: '500px', height: '100%', width: '100%' }}
      />

      {/* Map Floating Notifications */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* Pinpoint Calibration Active Banner */}
        {isPinpointCalibrationMode && (
          <div className="glass-panel bg-cyan-600/90 border border-cyan-400 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center gap-3 animate-pulse backdrop-blur-xl">
            <Crosshair className="w-4 h-4 text-white shrink-0 animate-spin" />
            <span>Click anywhere on the map or drag the blue marker to set your exact location</span>
            {onCancelCalibrationMode && (
              <button
                onClick={onCancelCalibrationMode}
                className="ml-2 bg-slate-950/70 hover:bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg border border-white/20 transition-all"
              >
                Done
              </button>
            )}
          </div>
        )}

        {isReportingMode && (
          <div className="glass-panel bg-rose-500/80 border border-rose-400/50 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Click anywhere on the map to pinpoint incident</span>
          </div>
        )}

        {/* GPS Error Notification Banner */}
        {gpsError && !isCalibrated && (
          <div className="glass-card bg-amber-950/90 border border-amber-500/50 rounded-2xl p-3 shadow-2xl text-xs text-amber-200 flex items-start gap-2.5 max-w-sm backdrop-blur-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block text-amber-300">Location Access</span>
              <span className="text-[11px] leading-relaxed block text-amber-200/90 font-light">{gpsError}</span>
            </div>
            {onOpenCalibrationModal && (
              <button
                onClick={onOpenCalibrationModal}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] rounded-lg shadow transition-all shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95"
                title="Calibrate exact location"
              >
                <Crosshair className="w-3 h-3" />
                <span>Calibrate</span>
              </button>
            )}
          </div>
        )}

        {/* GPS Live Status & Accuracy Card with Anti-Fluctuation Controls */}
        {activeGpsLat !== null && activeGpsLng !== null && (
          <div className="glass-card bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl text-xs text-slate-300 pointer-events-auto max-w-xs font-mono">
            <div className="flex items-center justify-between gap-2 font-sans font-bold text-cyan-300 pb-1.5 mb-1.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCalibrated || isLocked ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'} animate-pulse`} />
                <span className="text-xs font-mono tracking-tight">{isCalibrated || isLocked ? 'LOCKED PIN' : 'GPS FILTERED'}</span>
              </div>
              {isCalibrated || isLocked ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-1.5 py-0.5 rounded font-sans flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Fixed</span>
                  </span>
                  {onUnlockLocation && (
                    <button
                      onClick={onUnlockLocation}
                      className="text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
                      title="Unlock GPS live stream"
                    >
                      <Unlock className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {onLockLocation && (
                    <button
                      onClick={onLockLocation}
                      className="text-[10px] font-bold text-cyan-300 bg-cyan-600/30 hover:bg-cyan-500/50 border border-cyan-400/40 px-2 py-0.5 rounded font-sans transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow"
                      title="Freeze this location now so it won't fluctuate"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Lock Spot</span>
                    </button>
                  )}
                  {activeAccuracy !== null && activeAccuracy > 150 ? (
                    <button
                      onClick={onOpenCalibrationModal}
                      className="text-[10px] font-bold text-amber-300 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 px-1.5 py-0.5 rounded font-sans transition-colors cursor-pointer flex items-center gap-1"
                      title="Click to calibrate exact spot"
                    >
                      <span>Fix</span>
                      <Crosshair className="w-2.5 h-2.5" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            <div className="text-[11px] space-y-0.5 text-slate-300 font-light">
              <div>Lat: <span className="text-slate-100 font-semibold">{activeGpsLat.toFixed(6)}</span></div>
              <div>Lng: <span className="text-slate-100 font-semibold">{activeGpsLng.toFixed(6)}</span></div>
              <div className="flex items-center justify-between pt-0.5">
                <span>Accuracy: <strong className="text-emerald-300">{isCalibrated || isLocked ? 'Locked Exact' : activeAccuracy !== null ? `±${Math.round(activeAccuracy)}m` : 'N/A'}</strong></span>
                {onOpenCalibrationModal && (
                  <button
                    onClick={onOpenCalibrationModal}
                    className="text-[10px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer font-sans"
                  >
                    Adjust
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Map Controls: My Location, Calibrate & Fit Route */}
      {!isNavigating && (
        <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 flex-wrap">
          {/* Dedicated "My Location" Button */}
          <button
            onClick={handleCenterOnMyLocation}
            className="glass-card bg-slate-900/80 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400/70 px-3.5 py-2 rounded-xl text-xs font-bold backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            title="Recenter on My Location"
          >
            <Locate className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>My Location</span>
          </button>

          {/* Calibrate Exact Location Button */}
          {onOpenCalibrationModal && (
            <button
              onClick={onOpenCalibrationModal}
              className="glass-card bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 px-3.5 py-2 rounded-xl text-xs font-bold backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              title="Calibrate exact spot on map or address"
            >
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>Calibrate Spot</span>
            </button>
          )}

          {/* Fit Route Bounds Button (if route exists) */}
          {routes.length > 0 && (
            <button
              onClick={handleRecenterRoute}
              className="glass-card bg-slate-900/80 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/15 hover:border-white/30 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              title="Fit route to view"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              <span>Fit Route</span>
            </button>
          )}
        </div>
      )}

      {/* Map Legend Overlay */}
      {!isNavigating && (
        <div className="absolute top-3 right-3 z-[400] glass-card bg-slate-950/80 backdrop-blur-xl border border-white/15 px-3 py-2.5 rounded-2xl text-[11px] text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hidden sm:flex flex-col gap-1.5">
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 pb-1 border-b border-white/[0.08]">
            Safety Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)] inline-block"></span>
            <span className="text-slate-200 font-light">High Safety (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)] inline-block"></span>
            <span className="text-slate-200 font-light">Moderate (65-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)] inline-block"></span>
            <span className="text-slate-200 font-light">Caution (&lt;65)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white inline-block shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
            <span className="text-slate-200 font-light">Your Location (Wi-Fi / Cell GPS)</span>
          </div>
        </div>
      )}
    </div>
  );
};
