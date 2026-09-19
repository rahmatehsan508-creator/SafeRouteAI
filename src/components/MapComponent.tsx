import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CommunityReport, Coordinates, GpsLocation, RouteOption } from '../types';
import { Locate, AlertTriangle, RotateCcw, Crosshair, Check, X, Lock, Unlock, Shield, ShieldCheck, Hospital, Sun, Video, Eye, Navigation, Layers, Zap } from 'lucide-react';
import { getNearbySafeHavens, getSafetyZones, SafeHaven, SafetyZone } from '../safety/safeHavens';

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
  currentGpsCoords?: Coordinates | null;
  currentGpsLocation?: GpsLocation | null;
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
  theme?: 'light' | 'dark';
  destinationName?: string;
  onSetDestinationFromMap?: (name: string, coords: Coordinates) => void;
  hoveredRouteId?: string | null;
}

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
        <div style="transform: rotate(${heading}deg); transform-origin: center center;" class="absolute inset-0 flex items-start justify-center">
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[14px] border-b-blue-600 drop-shadow-md -mt-1"></div>
        </div>
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-white shadow-xl flex items-center justify-center z-10 border border-blue-200">
          <div class="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-inner"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="relative w-11 h-11 flex items-center justify-center pointer-events-none select-none">
      <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="absolute w-6 h-6 rounded-full bg-blue-400/30"></div>
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
  isLocked = false,
  theme = 'light',
  destinationName,
  onSetDestinationFromMap,
  hoveredRouteId = null
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylinesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const safeHavensLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const safetyZonesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer Visibility State
  const [showSafetyZones, setShowSafetyZones] = useState<boolean>(true);
  const [showSafeHavens, setShowSafeHavens] = useState<boolean>(true);

  // Persistent refs for smooth GPS marker updating
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
      const initialLat = activeGpsLat || sourceCoords?.lat || 59.3293;
      const initialLng = activeGpsLng || sourceCoords?.lng || 18.0686;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('dragstart', () => {
        if (onUserManualPan) {
          onUserManualPan();
        }
      });

      // Layer groups for safety hierarchy
      safetyZonesLayerGroupRef.current = L.layerGroup().addTo(map);
      polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
      safeHavensLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      reportsLayerGroupRef.current = L.layerGroup().addTo(map);
      gpsLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      const t1 = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 250);
      const t3 = setTimeout(() => map.invalidateSize(), 600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

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

  // Invalidate map size on theme/state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();
  }, [theme, isNavigating, selectedRouteId, routes.length]);

  // Handle map clicks
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

  // Render Safety Zones (Heatmap circles)
  // Render Safety Zones & Community Hazard Heatmap
  useEffect(() => {
    const zonesGroup = safetyZonesLayerGroupRef.current;
    if (!zonesGroup) return;

    zonesGroup.clearLayers();

    if (!showSafetyZones || isNavigating) return;

    const anchorCoords: Coordinates = {
      lat: activeGpsLat || sourceCoords?.lat || (routes[0]?.coordinates[0][0]) || 22.5726,
      lng: activeGpsLng || sourceCoords?.lng || (routes[0]?.coordinates[0][1]) || 88.3639
    };

    // 1. Base Macro Safety Zones
    const zones = getSafetyZones(anchorCoords);

    zones.forEach((zone) => {
      let color = '#10b981'; // Emerald (high safety)
      let fillColor = '#10b981';
      let opacity = 0.05;

      if (zone.level === 'moderate') {
        color = '#06b6d4'; // Cyan
        fillColor = '#06b6d4';
        opacity = 0.04;
      } else if (zone.level === 'caution') {
        color = '#f59e0b'; // Amber
        fillColor = '#f59e0b';
        opacity = 0.06;
      }

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color: color,
        fillColor: fillColor,
        fillOpacity: opacity,
        weight: 1,
        opacity: 0.25,
        dashArray: zone.level === 'caution' ? '3, 6' : undefined
      }).addTo(zonesGroup);

      circle.bindTooltip(`
        <div class="font-sans text-xs p-1">
          <div class="font-bold flex items-center gap-1">
            <span>🛡️ ${zone.name}</span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold">${zone.safetyRating}/100</span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5">${zone.description}</div>
        </div>
      `, { sticky: true });
    });

    // 2. Community Hazard Heatmap Overlay (Firestore Reports + Demo Baseline)
    reports.forEach((rep) => {
      let heatColor = '#f59e0b'; // Amber default
      let heatFill = '#f59e0b';
      let baseRadius = 130 + Math.min(rep.confirmations * 15, 100);

      if (rep.category === 'Reported Incident') {
        heatColor = '#e11d48'; // Rose/Red hazard
        heatFill = '#f43f5e';
      } else if (rep.category === 'Poor Lighting') {
        heatColor = '#6366f1'; // Indigo dark zone
        heatFill = '#818cf8';
      } else if (rep.category === 'Isolated Area') {
        heatColor = '#a855f7'; // Purple isolation
        heatFill = '#c084fc';
      } else if (rep.category === 'Road Damage') {
        heatColor = '#d97706'; // Amber road surface
        heatFill = '#fbbf24';
      }

      // Outer heat aura
      L.circle([rep.latitude, rep.longitude], {
        radius: baseRadius * 1.5,
        color: heatColor,
        fillColor: heatFill,
        fillOpacity: 0.08,
        weight: 0,
        interactive: false
      }).addTo(zonesGroup);

      // Core heat intensity ring
      const heatCore = L.circle([rep.latitude, rep.longitude], {
        radius: baseRadius * 0.7,
        color: heatColor,
        fillColor: heatFill,
        fillOpacity: 0.22,
        weight: 1.5,
        opacity: 0.4,
        dashArray: '2, 4'
      }).addTo(zonesGroup);

      heatCore.bindTooltip(`
        <div class="font-sans text-xs p-1">
          <div class="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>🔥 HAZARD HEATMAP ZONE</span>
          </div>
          <div class="font-bold text-slate-900 mt-0.5">${rep.category}</div>
          <div class="text-[10px] text-slate-500 font-mono">${rep.confirmations} community confirmations &bull; ${rep.status}</div>
        </div>
      `, { sticky: true });
    });
  }, [showSafetyZones, isNavigating, activeGpsLat, activeGpsLng, sourceCoords, routes, reports]);

  // Render 24/7 Safe Havens Markers
  useEffect(() => {
    const havensGroup = safeHavensLayerGroupRef.current;
    if (!havensGroup) return;

    havensGroup.clearLayers();

    if (!showSafeHavens || isNavigating) return;

    const anchorCoords: Coordinates = {
      lat: activeGpsLat || sourceCoords?.lat || (routes[0]?.coordinates[0][0]) || 59.3293,
      lng: activeGpsLng || sourceCoords?.lng || (routes[0]?.coordinates[0][1]) || 18.0686
    };

    const havens = getNearbySafeHavens(anchorCoords);

    havens.forEach((haven) => {
      let iconColor = 'bg-emerald-600';
      let symbol = '🛡️';

      if (haven.type === 'police') {
        iconColor = 'bg-blue-600';
        symbol = '👮';
      } else if (haven.type === 'hospital') {
        iconColor = 'bg-rose-600';
        symbol = '🏥';
      } else if (haven.type === 'pharmacy_247') {
        iconColor = 'bg-emerald-600';
        symbol = '💊';
      } else if (haven.type === 'transit_hub') {
        iconColor = 'bg-indigo-600';
        symbol = '🚇';
      } else if (haven.type === 'convenience_247') {
        iconColor = 'bg-amber-600';
        symbol = '🏪';
      }

      const havenIcon = L.divIcon({
        className: 'custom-safe-haven-pin',
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
            <div class="w-5 h-5 rounded-lg ${iconColor} border border-white/90 shadow-md flex items-center justify-center text-white text-[10px] transition-transform group-hover:scale-125">
              <span>${symbol}</span>
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const popupHtml = `
        <div class="font-sans text-xs text-slate-800 p-1.5 min-w-[200px]">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              24/7 Verified Safe Haven
            </span>
            ${haven.phone ? `<span class="text-[10px] font-mono font-bold text-slate-500">📞 ${haven.phone}</span>` : ''}
          </div>
          <strong class="text-slate-900 font-bold block text-sm">${haven.name}</strong>
          <p class="text-slate-600 text-[11px] mt-1">${haven.address}</p>
        </div>
      `;

      L.marker([haven.coordinates.lat, haven.coordinates.lng], { icon: havenIcon })
        .bindPopup(popupHtml)
        .addTo(havensGroup);
    });
  }, [showSafeHavens, isNavigating, activeGpsLat, activeGpsLng, sourceCoords, routes]);

  // Update Route Polylines and Direct Safety Highlighting
  useEffect(() => {
    const polylinesGroup = polylinesLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!polylinesGroup || !map) return;

    polylinesGroup.clearLayers();

    if (routes.length === 0) return;

    // Identify highest safety route vs fastest
    const safestRoute = [...routes].sort((a, b) => b.safetyScore - a.safetyScore)[0];
    const fastestRoute = [...routes].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];

    // Render non-selected & non-hovered routes first, then selected, then hovered on top
    const sortedRoutes = [...routes].sort((a, b) => {
      if (a.id === hoveredRouteId) return 1;
      if (b.id === hoveredRouteId) return -1;
      if (a.id === selectedRouteId) return 1;
      if (b.id === selectedRouteId) return -1;
      return 0;
    });

    let selectedLatLngs: L.LatLng[] = [];

    sortedRoutes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const isHovered = route.id === hoveredRouteId;
      const isSafest = route.id === safestRoute?.id;
      const isFastestOnly = route.id === fastestRoute?.id && route.safetyScore < 75;
      const latLngs = route.coordinates.map(([lat, lng]) => L.latLng(lat, lng));

      if (isSelected) {
        selectedLatLngs = latLngs;
      }

      if (isNavigating && !isSelected) {
        return;
      }

      // Safety color theme
      let strokeColor = '#10b981'; // Emerald for Safe
      if (route.safetyScore < 68) {
        strokeColor = '#f59e0b'; // Amber for Caution/Fastest
      } else if (route.safetyScore < 82) {
        strokeColor = '#06b6d4'; // Cyan for Balanced
      }

      // Glowing outer casing for selected or hovered route
      if (isSelected || isHovered) {
        const casingColor = isHovered
          ? (isSafest ? '#10b981' : isFastestOnly ? '#f59e0b' : '#06b6d4')
          : (isSafest ? '#10b981' : isFastestOnly ? '#f59e0b' : '#06b6d4');

        L.polyline(latLngs, {
          color: casingColor,
          weight: isHovered ? 18 : 14,
          opacity: isHovered ? 0.65 : 0.45,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(polylinesGroup);
      }

      // Main Route Line
      const polyline = L.polyline(latLngs, {
        color: (isSelected || isHovered) ? strokeColor : (theme === 'light' ? '#94a3b8' : '#475569'),
        weight: isHovered ? 7.5 : isSelected ? 6.5 : 3.5,
        opacity: (isSelected || isHovered) ? 1.0 : 0.35,
        dashArray: (isFastestOnly && !isSelected && !isHovered) ? '4, 6' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(polylinesGroup);

      // Interactive click to select
      polyline.on('click', () => {
        if (!isNavigating && !isPinpointCalibrationMode) {
          onSelectRoute(route.id);
        }
      });

      polyline.bindTooltip(
        `
        <div class="text-xs font-sans">
          <div class="font-bold flex items-center gap-1">
            <span>${isSafest ? '🛡️ SAFEST PATH:' : isFastestOnly ? '⚡ FASTEST SHORTCUT:' : '🛣️ ROUTE:'}</span>
            <span>${route.name}</span>
          </div>
          <div class="mt-0.5">Safety Score: <strong class="text-emerald-600">${route.safetyScore}/100</strong> &bull; ${route.durationFormatted}</div>
        </div>
      `,
        { sticky: true }
      );

      // Add On-Route Midpoint Interactive Badge
      if (latLngs.length > 4 && !isNavigating) {
        const midIdx = Math.floor(latLngs.length / 2);
        const midPoint = latLngs[midIdx];

        const badgeHtml = isHovered
          ? `
            <div class="cursor-pointer shadow-2xl rounded-full px-3 py-1 text-[11px] font-black border flex items-center gap-1.5 whitespace-nowrap bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-white ring-4 ring-cyan-400/80 scale-110 z-50 animate-pulse">
              <span>🔍 PREVIEW: ${route.safetyScore}% Safe</span>
              <span class="opacity-90 font-mono text-[10px] font-normal">(${route.durationFormatted})</span>
            </div>
          `
          : isSelected
          ? (isSafest ? `
            <div class="cursor-pointer shadow-xl rounded-full px-2.5 py-1 text-[11px] font-black border flex items-center gap-1.5 whitespace-nowrap bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/50 scale-105 z-50">
              <span>🛡️ ${route.safetyScore}% Safe</span>
              <span class="opacity-90 font-mono text-[10px] font-normal">(${route.durationFormatted})</span>
            </div>
          ` : `
            <div class="cursor-pointer shadow-xl rounded-full px-2.5 py-1 text-[11px] font-black border flex items-center gap-1.5 whitespace-nowrap bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 scale-105 z-50">
              <span>⚡ ${route.safetyScore}% Safe</span>
              <span class="opacity-90 font-mono text-[10px] font-normal">(${route.durationFormatted})</span>
            </div>
          `)
          : `
            <div class="cursor-pointer shadow-md rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap opacity-65 hover:opacity-100 transition-all bg-slate-900/90 text-slate-200 border-slate-700 hover:scale-105">
              <span>${isSafest ? '🛡️' : '⚡'} ${route.safetyScore}%</span>
              <span class="text-[9px] opacity-75">(${route.durationFormatted})</span>
            </div>
          `;

        const badgeIcon = L.divIcon({
          className: 'custom-route-badge',
          html: badgeHtml,
          iconSize: isHovered ? [130, 28] : isSelected ? [110, 26] : [75, 20],
          iconAnchor: isHovered ? [65, 14] : isSelected ? [55, 13] : [37, 10]
        });

        const badgeMarker = L.marker(midPoint, { icon: badgeIcon, zIndexOffset: isHovered ? 2000 : isSelected ? 1000 : 100 }).addTo(polylinesGroup);
        badgeMarker.on('click', () => onSelectRoute(route.id));
      }
    });

    if (selectedLatLngs.length > 0 && !isNavigating) {
      const bounds = L.latLngBounds(selectedLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [routes, selectedRouteId, hoveredRouteId, onSelectRoute, isNavigating, isPinpointCalibrationMode, theme]);

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
            <strong class="text-emerald-700 font-semibold block text-sm">Origin</strong>
            <span>Lat: ${sourceCoords.lat.toFixed(4)}, Lng: ${sourceCoords.lng.toFixed(4)}</span>
          </div>
        `)
        .addTo(markersGroup);
    }

    if (destCoords) {
      const labelText = destinationName || 'Destination';
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div class="relative flex flex-col items-center pointer-events-auto group">
            <div class="bg-slate-900/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1 whitespace-nowrap mb-0.5 opacity-85 group-hover:opacity-100 transition-opacity">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span class="truncate max-w-[110px]">${labelText}</span>
            </div>
            <div class="w-4 h-4 rounded-full bg-slate-950 dark:bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950"></div>
            </div>
          </div>
        `,
        iconSize: [100, 36],
        iconAnchor: [50, 36]
      });

      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .bindPopup(`
          <div class="font-sans text-xs text-slate-800 dark:text-slate-100 p-1">
            <strong class="text-slate-900 dark:text-white font-semibold block text-sm">${labelText}</strong>
            <span>Lat: ${destCoords.lat.toFixed(4)}, Lng: ${destCoords.lng.toFixed(4)}</span>
          </div>
        `)
        .addTo(markersGroup);
    }
  }, [sourceCoords, destCoords, isNavigating, destinationName]);

  // LIVE GPS LOCATION & ACCURACY CIRCLE UPDATE
  useEffect(() => {
    const gpsGroup = gpsLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!gpsGroup || !map) return;

    if (activeGpsLat === null || activeGpsLng === null) {
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

    const latLng = L.latLng(activeGpsLat, activeGpsLng);

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
        ? `🎯 Calibrated Location` 
        : `Your Live Location (${activeAccuracy ? `±${Math.round(activeAccuracy)}m` : 'GPS'})`;
      
      userGpsMarkerRef.current.bindTooltip(tooltipText, {
        direction: 'top',
        offset: [0, -14]
      });

      lastHeadingRef.current = activeHeading;
    } else {
      userGpsMarkerRef.current.setLatLng(latLng);
    }

    if (isNavigating && isFollowingLocation) {
      map.panTo(latLng, { animate: true, duration: 0.6 });
    } else if (!hasCenteredInitiallyRef.current && routes.length === 0 && !sourceCoords && !destCoords) {
      hasCenteredInitiallyRef.current = true;
      map.setView(latLng, 15, { animate: true });
    }
  }, [activeGpsLat, activeGpsLng, activeAccuracy, activeHeading, isCalibrated, isNavigating, isFollowingLocation, routes.length, sourceCoords, destCoords]);

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
          <div class="relative flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity">
            <div class="w-4 h-4 rounded-full ${iconColor} border border-white shadow-sm flex items-center justify-center text-white text-[8px] font-bold">
              !
            </div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const popupHtml = `
        <div class="font-sans text-xs text-slate-800 p-1 min-w-[200px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full ${iconColor}"></span>
            <strong class="font-semibold text-slate-900">${rep.category}</strong>
          </div>
          ${rep.photoUrl ? `
            <div class="my-1.5 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <img src="${rep.photoUrl}" alt="Hazard photo" class="w-full h-24 object-cover" />
            </div>
          ` : ''}
          <p class="text-slate-600 text-[11px] mb-1 leading-snug">${rep.description}</p>
          <div class="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-1 font-mono">
            <span>Status: ${rep.status}</span>
            <span>${rep.confirmations} verified</span>
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

  // Center on My Location
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
        alert('Detecting your GPS location. Please ensure location services are enabled.');
      }
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col ${isPinpointCalibrationMode ? 'ring-2 ring-cyan-400 cursor-crosshair' : ''}`}>
      {/* Map DOM Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 min-h-[500px] z-0"
        style={{ minHeight: '500px', height: '100%', width: '100%' }}
      />

      {/* TOP-RIGHT ON-MAP SAFETY OVERLAYS BAR */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl">
        <button
          onClick={() => setShowSafetyZones(!showSafetyZones)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            showSafetyZones
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
          title="Toggle Safety Heatmap Zones"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Safe Zones</span>
        </button>

        <button
          onClick={() => setShowSafeHavens(!showSafeHavens)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            showSafeHavens
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
          title="Toggle 24/7 Safe Havens (Police, Hospital, Pharmacy)"
        >
          <Hospital className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Safe Havens</span>
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

        <button
          onClick={handleRecenterRoute}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Fit Route to Screen"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleCenterOnMyLocation}
          className="p-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition-colors"
          title="Center on My Location"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* TOP-LEFT NOTIFICATIONS / CALIBRATION BANNER */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        {isPinpointCalibrationMode && (
          <div className="glass-panel bg-cyan-600/90 border border-cyan-400 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse backdrop-blur-xl">
            <Crosshair className="w-4 h-4 text-white shrink-0 animate-spin" />
            <span>Click anywhere on the map to place your exact location</span>
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
          <div className="glass-panel bg-rose-500/80 border border-rose-400/50 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Click on map to report safety hazard or dark zone</span>
          </div>
        )}
      </div>
    </div>
  );
};
