import { RouteAIExplanation, RouteOption, RoutePreference, TravelMode } from '../types';

/**
 * Deterministic fallback generator if Gemini API is unreachable or rate-limited
 */
export function getDeterministicRouteExplanation(
  route: RouteOption,
  travelMode: TravelMode,
  preference: RoutePreference
): RouteAIExplanation {
  const { safetyScore, safetyFactors, keyPositives, keyConcerns, name, distanceKm, durationFormatted } = route;

  let summary = '';
  if (safetyScore >= 85) {
    summary = `${name} is strongly recommended for ${travelMode} under ${preference} preference. It keeps to well-lit, active arterial streets with continuous visibility.`;
  } else if (safetyScore >= 70) {
    summary = `${name} provides a balanced route (${distanceKm} km, ${durationFormatted}) with moderate safety characteristics. Standard awareness is advised.`;
  } else {
    summary = `${name} registers an estimated Safety Score of ${safetyScore}/100 due to lower lighting or reduced public foot traffic along specific segments.`;
  }

  const safetyBreakdown = `Estimated Lighting is scored at ${safetyFactors.lighting}/100, Public Presence at ${safetyFactors.publicPresence}/100, and Road Condition at ${safetyFactors.roadCondition}/100. Isolation rating is ${safetyFactors.isolation}/100 (where higher indicates more urban integration).`;

  const timeContext = safetyFactors.timeOfDayMultiplier < 1.0
    ? `Nighttime / off-peak travel multiplier (${safetyFactors.timeOfDayMultiplier}) applied due to diminished ambient light and reduced bystander density.`
    : `Daytime travel window benefits from peak commercial activity and active pedestrian presence.`;

  const recommendations = [
    ...keyPositives.map(p => `Advantage: ${p}`),
    ...keyConcerns.map(c => `Advisory: ${c}`)
  ];

  if (recommendations.length === 0) {
    recommendations.push('Follow standard urban navigation precautions.');
  }

  return {
    summary,
    safetyBreakdown,
    timeContext,
    recommendations,
    isAiGenerated: false
  };
}

/**
 * Requests Gemini explanation from server-side endpoint /api/gemini/explain-route
 */
export async function getRouteExplanation(
  selectedRoute: RouteOption,
  allRoutes: RouteOption[],
  travelMode: TravelMode,
  preference: RoutePreference
): Promise<RouteAIExplanation> {
  try {
    const payload = {
      selectedRoute: {
        id: selectedRoute.id,
        name: selectedRoute.name,
        distanceKm: selectedRoute.distanceKm,
        durationFormatted: selectedRoute.durationFormatted,
        safetyScore: selectedRoute.safetyScore,
        safetyFactors: selectedRoute.safetyFactors,
        keyPositives: selectedRoute.keyPositives,
        keyConcerns: selectedRoute.keyConcerns
      },
      alternativesCount: allRoutes.length,
      travelMode,
      preference
    };

    const response = await fetch('/api/gemini/explain-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.summary) {
        return {
          summary: data.summary,
          safetyBreakdown: data.safetyBreakdown || '',
          timeContext: data.timeContext || '',
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          isAiGenerated: true
        };
      }
    }
  } catch (err) {
    console.warn('[Gemini Client] Failed to reach explanation endpoint, falling back to deterministic engine:', err);
  }

  return getDeterministicRouteExplanation(selectedRoute, travelMode, preference);
}
