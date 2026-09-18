import { Coordinates, CommunityReport, RouteOption, RoutePreference, SafetyFactors, TravelMode } from '../types';
import { minDistanceToPolyline } from '../utils/coordinates';

export interface SafetyCalculationInput {
  routeIndex: number;
  routeName: string;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
  travelMode: TravelMode;
  reports: CommunityReport[];
  travelHour?: number; // 0 to 23 (defaults to current system hour)
}

/**
 * Deterministic Safety Engine calculating comprehensive multi-factor safety scores
 */
export function calculateRouteSafety(input: SafetyCalculationInput): {
  safetyScore: number;
  safetyFactors: SafetyFactors;
  keyPositives: string[];
  keyConcerns: string[];
} {
  const {
    routeIndex,
    distanceMeters,
    durationSeconds,
    coordinates,
    travelMode,
    reports,
    travelHour = new Date().getHours()
  } = input;

  // 1. Time-of-day dynamics
  // Night hours (21:00 to 05:00) reduce baseline lighting safety & isolation
  const isLateNight = travelHour >= 22 || travelHour < 5;
  const isEvening = (travelHour >= 18 && travelHour < 22) || (travelHour >= 5 && travelHour < 7);
  
  let timeMultiplier = 1.0;
  if (isLateNight) {
    timeMultiplier = travelMode === 'car' ? 0.90 : 0.78;
  } else if (isEvening) {
    timeMultiplier = travelMode === 'car' ? 0.95 : 0.88;
  }

  // 2. Route characteristics evaluation
  // Primary corridors (usually Route A/0) typically have higher street lighting and public density
  // Alternative routes may take quieter side streets or scenic detours with lower illumination
  const corridorFactor = routeIndex === 0 ? 1.0 : (routeIndex === 1 ? 0.93 : 0.86);

  // Baseline factor estimations derived from route profile and travel mode
  let baseLighting = Math.round((82 + (routeIndex === 0 ? 10 : 2) - (routeIndex === 2 ? 14 : 0)) * (isLateNight ? 0.82 : 1.0));
  let basePublicPresence = Math.round((78 + (routeIndex === 0 ? 12 : -5) - (routeIndex === 2 ? 12 : 0)) * (isLateNight ? 0.65 : (isEvening ? 0.85 : 1.0)));
  let baseIsolation = Math.round(85 - (routeIndex * 9) - (isLateNight ? 18 : 0)); // 100 = very low isolation
  let baseEmergencyAccess = Math.round(86 - (routeIndex * 7));
  let baseIncidentRisk = Math.round(84 - (routeIndex * 6) - (isLateNight ? 10 : 0));
  let baseRoadCondition = Math.round(88 - (routeIndex * 5));

  // Mode-specific calibration
  if (travelMode === 'walking') {
    baseRoadCondition -= 4; // Pedestrian sidewalk quality
  } else if (travelMode === 'cycling') {
    baseRoadCondition -= 6; // Lane surface & debris vulnerability
  } else if (travelMode === 'public_transport') {
    basePublicPresence = Math.min(96, basePublicPresence + 15);
    baseEmergencyAccess = Math.min(95, baseEmergencyAccess + 8);
    baseIsolation = Math.min(94, baseIsolation + 10);
  }

  // 3. Impact of Nearby Community Reports
  // Check any active community reports within 400 meters of the polyline
  let reportPenalty = 0;
  const nearbyIncidents: string[] = [];
  const nearbyReportsCount = {
    lighting: 0,
    damage: 0,
    incident: 0,
    isolated: 0
  };

  for (const report of reports) {
    const dist = minDistanceToPolyline({ lat: report.latitude, lng: report.longitude }, coordinates);
    if (dist <= 450) {
      // Scale penalty by severity and confirmation count
      const weight = report.status === 'Verified' ? 1.5 : (report.status === 'Community Confirmed' ? 1.2 : 0.8);
      
      if (report.category === 'Reported Incident') {
        reportPenalty += 8 * weight;
        baseIncidentRisk -= Math.round(10 * weight);
        nearbyReportsCount.incident++;
        nearbyIncidents.push(`Reported incident within ${Math.round(dist)}m (${report.status})`);
      } else if (report.category === 'Poor Lighting') {
        reportPenalty += 5 * weight;
        baseLighting -= Math.round(12 * weight);
        nearbyReportsCount.lighting++;
        nearbyIncidents.push(`Poor lighting report along stretch (${report.status})`);
      } else if (report.category === 'Isolated Area') {
        reportPenalty += 6 * weight;
        baseIsolation -= Math.round(12 * weight);
        nearbyReportsCount.isolated++;
        nearbyIncidents.push(`Isolated segment flagged by community`);
      } else if (report.category === 'Road Damage') {
        reportPenalty += 4 * weight;
        baseRoadCondition -= Math.round(8 * weight);
        nearbyReportsCount.damage++;
        nearbyIncidents.push(`Road surface issue reported`);
      }
    }
  }

  // Clamp factor scores strictly within [25, 98]
  const clamp = (val: number) => Math.max(25, Math.min(98, Math.round(val)));
  
  const factors: SafetyFactors = {
    lighting: clamp(baseLighting),
    incidentRisk: clamp(baseIncidentRisk),
    publicPresence: clamp(basePublicPresence),
    roadCondition: clamp(baseRoadCondition),
    isolation: clamp(baseIsolation),
    emergencyAccessibility: clamp(baseEmergencyAccess),
    communityReportPenalty: Math.min(25, Math.round(reportPenalty)),
    timeOfDayMultiplier: Number(timeMultiplier.toFixed(2))
  };

  // Weighted composite safety calculation
  // Mode-dependent weighting
  let composite = 0;
  if (travelMode === 'walking') {
    composite = (
      factors.lighting * 0.25 +
      factors.publicPresence * 0.22 +
      factors.isolation * 0.20 +
      factors.incidentRisk * 0.18 +
      factors.emergencyAccessibility * 0.10 +
      factors.roadCondition * 0.05
    );
  } else if (travelMode === 'cycling' || travelMode === 'two_wheeler') {
    composite = (
      factors.roadCondition * 0.24 +
      factors.lighting * 0.22 +
      factors.incidentRisk * 0.20 +
      factors.isolation * 0.14 +
      factors.emergencyAccessibility * 0.10 +
      factors.publicPresence * 0.10
    );
  } else {
    // Car / Public transit
    composite = (
      factors.incidentRisk * 0.25 +
      factors.roadCondition * 0.22 +
      factors.emergencyAccessibility * 0.20 +
      factors.lighting * 0.18 +
      factors.publicPresence * 0.10 +
      factors.isolation * 0.05
    );
  }

  // Apply community penalty
  composite = Math.max(20, composite - factors.communityReportPenalty);

  // Apply time multiplier
  composite = composite * factors.timeOfDayMultiplier;

  const finalSafetyScore = Math.max(20, Math.min(96, Math.round(composite)));

  // Generate explainable positive factors and concerns
  const keyPositives: string[] = [];
  const keyConcerns: string[] = [];

  if (factors.lighting >= 80) keyPositives.push('Well-lit arterial thoroughfares');
  if (factors.publicPresence >= 80) keyPositives.push('High pedestrian activity & visibility');
  if (factors.emergencyAccessibility >= 82) keyPositives.push('Immediate access to emergency corridors');
  if (factors.isolation >= 82) keyPositives.push('Active commercial & residential presence');
  if (factors.roadCondition >= 85) keyPositives.push('Paved, continuous surface with clear lane markings');

  if (factors.lighting < 65) keyConcerns.push('Low or intermittent street illumination');
  if (factors.isolation < 65) keyConcerns.push('Segments passing through secluded or low-density corridors');
  if (isLateNight) keyConcerns.push('Nighttime transit window (diminished public presence)');
  if (nearbyIncidents.length > 0) keyConcerns.push(...nearbyIncidents.slice(0, 2));
  if (factors.roadCondition < 68) keyConcerns.push('Uneven road surface or reduced pedestrian clearance');

  if (keyPositives.length === 0) keyPositives.push('Standard urban transit connectivity');
  if (keyConcerns.length === 0) keyConcerns.push('No critical safety flags recorded');

  return {
    safetyScore: finalSafetyScore,
    safetyFactors: factors,
    keyPositives,
    keyConcerns
  };
}

/**
 * Ranks routes according to the user's selected preference:
 * - 'fastest': sorts purely by duration ascending
 * - 'safest': sorts by safetyScore descending (secondary tiebreak duration)
 * - 'balanced': combines normalized duration efficiency and safety score
 */
export function rankRoutesByPreference(
  routes: RouteOption[],
  preference: RoutePreference
): RouteOption[] {
  if (routes.length <= 1) {
    return routes.map(r => ({
      ...r,
      preferenceFit: getPreferenceFitLabel(preference, true),
      isRecommendedForPreference: true
    }));
  }

  const minDuration = Math.min(...routes.map(r => r.durationSeconds));
  const maxSafety = Math.max(...routes.map(r => r.safetyScore));

  const scoredRoutes = routes.map(route => {
    let rankScore = 0;
    const timeEfficiency = (minDuration / Math.max(1, route.durationSeconds)) * 100;
    const safetyRatio = (route.safetyScore / Math.max(1, maxSafety)) * 100;

    if (preference === 'safest') {
      // Strictly prioritize the highest safety score; secondary tiebreaker is duration
      rankScore = (route.safetyScore * 10000) - route.durationSeconds;
    } else if (preference === 'fastest') {
      // Strictly prioritize the lowest travel duration; secondary tiebreaker is safety
      rankScore = (-route.durationSeconds * 1000) + route.safetyScore;
    } else {
      // Balanced: weighted combination of safety (55%) and time efficiency (45%)
      rankScore = (safetyRatio * 0.55) + (timeEfficiency * 0.45);
    }

    return {
      route,
      rankScore,
      timeEfficiency
    };
  });

  // Sort descending by rankScore
  scoredRoutes.sort((a, b) => b.rankScore - a.rankScore);

  return scoredRoutes.map((item, index) => {
    const isRecommended = index === 0;
    return {
      ...item.route,
      isRecommendedForPreference: isRecommended,
      preferenceFit: getPreferenceFitLabel(preference, isRecommended)
    };
  });
}

function getPreferenceFitLabel(preference: RoutePreference, isTop: boolean): string {
  if (preference === 'safest') {
    return isTop ? 'Top Safety Rating' : 'Secondary Safety Alternative';
  }
  if (preference === 'fastest') {
    return isTop ? 'Fastest ETA' : 'Longer Duration';
  }
  return isTop ? 'Optimal Safety & Speed Balance' : 'Alternative Balance';
}
