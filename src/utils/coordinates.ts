import { Coordinates } from '../types';

/**
 * Converts a GeoJSON [longitude, latitude] pair or coordinate array to Leaflet [latitude, longitude]
 */
export function geoJsonToLeaflet(geoJsonCoord: [number, number]): [number, number] {
  if (!Array.isArray(geoJsonCoord) || geoJsonCoord.length < 2) {
    throw new Error('Invalid GeoJSON coordinate: expected [longitude, latitude]');
  }
  const [lng, lat] = geoJsonCoord;
  if (!isValidCoordinate(lat, lng)) {
    console.warn(`[geoJsonToLeaflet] Suspicious coordinate values: lat=${lat}, lng=${lng}`);
  }
  return [lat, lng];
}

/**
 * Converts an array of GeoJSON coordinates [[lng, lat], ...] to Leaflet [[lat, lng], ...]
 */
export function geoJsonArrayToLeaflet(coords: [number, number][]): [number, number][] {
  return coords.map((c) => geoJsonToLeaflet(c));
}

/**
 * Converts Leaflet [latitude, longitude] to GeoJSON [longitude, latitude]
 */
export function leafletToGeoJson(leafletCoord: [number, number]): [number, number] {
  if (!Array.isArray(leafletCoord) || leafletCoord.length < 2) {
    throw new Error('Invalid Leaflet coordinate: expected [latitude, longitude]');
  }
  const [lat, lng] = leafletCoord;
  if (!isValidCoordinate(lat, lng)) {
    console.warn(`[leafletToGeoJson] Suspicious coordinate values: lat=${lat}, lng=${lng}`);
  }
  return [lng, lat];
}

/**
 * Validates that latitude is within [-90, 90] and longitude is within [-180, 180]
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    !isNaN(lat) &&
    typeof lng === 'number' &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Formats coordinates for display or API calls
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}

/**
 * Calculates Great Circle distance between two points in meters (Haversine formula)
 */
export function calculateHaversineDistance(
  c1: { lat: number; lng: number },
  c2: { lat: number; lng: number }
): number {
  const R = 6371e3; // metres
  const phi1 = (c1.lat * Math.PI) / 180;
  const phi2 = (c2.lat * Math.PI) / 180;
  const deltaPhi = ((c2.lat - c1.lat) * Math.PI) / 180;
  const deltaLambda = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates minimum distance from a point to a polyline in meters
 */
export function minDistanceToPolyline(
  point: { lat: number; lng: number },
  polyline: [number, number][]
): number {
  if (!polyline.length) return Infinity;
  let minDist = Infinity;
  for (const [lat, lng] of polyline) {
    const d = calculateHaversineDistance(point, { lat, lng });
    if (d < minDist) minDist = d;
  }
  return minDist;
}
