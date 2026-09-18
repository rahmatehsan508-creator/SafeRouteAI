import { Coordinates, NavigationProgress, RouteOption, RouteStep, TravelMode } from '../types';
import { calculateHaversineDistance, minDistanceToPolyline } from '../utils/coordinates';

/**
 * Calculates real-time navigation progress along the active selected route
 */
export function calculateNavigationProgress(
  currentCoords: Coordinates,
  route: RouteOption,
  travelMode: TravelMode
): NavigationProgress {
  const coords = route.coordinates;
  if (!coords || coords.length === 0) {
    return {
      currentCoords,
      remainingDistanceMeters: route.distanceMeters,
      remainingDurationSeconds: route.durationSeconds,
      currentStepIndex: 0,
      currentStep: route.steps?.[0] || null,
      nextStep: route.steps?.[1] || null,
      isOffRoute: false,
      offRouteDistanceMeters: 0,
      distanceTraveledMeters: 0
    };
  }

  // 1. Find closest coordinate on route
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < coords.length; i++) {
    const [lat, lng] = coords[i];
    const dist = calculateHaversineDistance(currentCoords, { lat, lng });
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // 2. Off-route detection threshold: 85 meters
  const isOffRoute = minDistance > 85;

  // 3. Compute remaining distance along route from closestIndex onwards
  let remainingMeters = 0;
  for (let i = closestIndex; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    remainingMeters += calculateHaversineDistance({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
  }

  // Add distance from current position to closest point on polyline
  remainingMeters += minDistance;

  // Distance traveled
  const distanceTraveledMeters = Math.max(0, route.distanceMeters - remainingMeters);

  // Remaining duration: calculate by proportion or mode speed
  const progressRatio = Math.min(1.0, distanceTraveledMeters / Math.max(1, route.distanceMeters));
  const remainingDurationSeconds = Math.max(0, Math.round(route.durationSeconds * (1 - progressRatio)));

  // 4. Determine current & next turn steps
  const steps = route.steps || [];
  let currentStepIndex = 0;
  let currentStep: RouteStep | null = steps[0] || null;
  let nextStep: RouteStep | null = steps[1] || null;

  if (steps.length > 0) {
    // Find closest step ahead of the user
    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx];
      const distToStep = calculateHaversineDistance(currentCoords, {
        lat: step.coordinates[0],
        lng: step.coordinates[1]
      });

      // If user hasn't passed this step yet (or is within 35 meters)
      if (distToStep < 40 || sIdx >= steps.length - 1) {
        currentStepIndex = sIdx;
        currentStep = steps[sIdx];
        nextStep = steps[sIdx + 1] || null;
        break;
      }
    }
  }

  return {
    currentCoords,
    remainingDistanceMeters: Math.round(remainingMeters),
    remainingDurationSeconds,
    currentStepIndex,
    currentStep,
    nextStep,
    isOffRoute,
    offRouteDistanceMeters: Math.round(minDistance),
    distanceTraveledMeters: Math.round(distanceTraveledMeters)
  };
}
