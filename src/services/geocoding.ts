import { Coordinates, GeocodeLocation } from '../types';
import { isValidCoordinate } from '../utils/coordinates';

// In-memory cache to avoid repeated geocoding requests for identical queries
const geocodeCache = new Map<string, GeocodeLocation[]>();

/**
 * Common landmark presets for quick demonstration and instant high-accuracy resolution
 */
export const POPULAR_PRESETS: { label: string; address: string; coords: Coordinates }[] = [
  {
    label: 'Dankuni',
    address: 'Dankuni, Hooghly, West Bengal, India',
    coords: { lat: 22.6821, lng: 88.2907 }
  },
  {
    label: 'Bally',
    address: 'Bally, Howrah, West Bengal, India',
    coords: { lat: 22.6500, lng: 88.3444 }
  },
  {
    label: 'Victoria Memorial, Kolkata',
    address: 'Victoria Memorial Hall, 1 Queens Way, Maidan, Kolkata, West Bengal 700071',
    coords: { lat: 22.5448, lng: 88.3426 }
  },
  {
    label: 'Howrah Station, Kolkata',
    address: 'Howrah Railway Station, Howrah, West Bengal 711101',
    coords: { lat: 22.5839, lng: 88.3430 }
  },
  {
    label: 'Park Street, Kolkata',
    address: 'Mother Teresa Sarani, Park Street, Kolkata, West Bengal 700016',
    coords: { lat: 22.5510, lng: 88.3524 }
  },
  {
    label: 'Salt Lake Sector V, Kolkata',
    address: 'Sector V, Bidhannagar, Kolkata, West Bengal 700091',
    coords: { lat: 22.5804, lng: 88.4378 }
  },
  {
    label: 'Times Square, New York',
    address: 'Times Square, Manhattan, NY 10036, USA',
    coords: { lat: 40.7580, lng: -73.9855 }
  },
  {
    label: 'Central Park South, New York',
    address: 'Central Park South, New York, NY 10019, USA',
    coords: { lat: 40.7661, lng: -73.9772 }
  },
  {
    label: 'Tower of London, London',
    address: 'Tower of London, London EC3N 4AB, UK',
    coords: { lat: 51.5081, lng: -0.0759 }
  },
  {
    label: 'Hyde Park, London',
    address: 'Hyde Park, London W2 2UH, UK',
    coords: { lat: 51.5073, lng: -0.1657 }
  }
];

/**
 * Searches for a location by text query.
 * Uses local curated index first, then server `/api/geocode`, with fallback to OpenStreetMap Nominatim and Photon.
 */
export async function geocodeAddress(queryText: string): Promise<GeocodeLocation[]> {
  const trimmed = queryText.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check exact or partial match in popular landmarks
  const presetMatches = POPULAR_PRESETS.filter(
    p => p.label.toLowerCase().includes(cacheKey) || 
         p.address.toLowerCase().includes(cacheKey) ||
         cacheKey.includes(p.label.toLowerCase())
  ).map(p => ({
    name: p.label,
    formattedAddress: p.address,
    coordinates: p.coords
  }));

  if (presetMatches.length > 0) {
    geocodeCache.set(cacheKey, presetMatches);
    return presetMatches;
  }

  // 2. Try server-side proxy endpoint first (avoids CORS & rate limit)
  try {
    const resp = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = normalizeNominatimResults(data);
        if (results.length > 0) {
          geocodeCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch {
    // Continue to direct geocoders
  }

  // 3. Fallback direct to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = normalizeNominatimResults(data);
        if (results.length > 0) {
          geocodeCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch {
    // Fallback to Photon
  }

  // 4. Fallback to Photon (Komoot OSM search API)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`;
    const photonResp = await fetch(photonUrl);
    if (photonResp.ok) {
      const pData = await photonResp.json();
      if (pData?.features?.length > 0) {
        const results: GeocodeLocation[] = [];
        for (const feat of pData.features) {
          const coords = feat.geometry?.coordinates; // Photon is [lng, lat]
          if (Array.isArray(coords) && coords.length >= 2) {
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (isValidCoordinate(lat, lng)) {
              const name = feat.properties?.name || feat.properties?.street || trimmed;
              const details = [
                feat.properties?.city,
                feat.properties?.state,
                feat.properties?.country
              ].filter(Boolean).join(', ');
              results.push({
                name,
                formattedAddress: details ? `${name}, ${details}` : name,
                coordinates: { lat, lng }
              });
            }
          }
        }
        if (results.length > 0) {
          geocodeCache.set(cacheKey, results);
          return results;
        }
      }
    }
  } catch (err) {
    console.warn('[Geocoding] All providers failed or offline:', err);
  }

  // If no external results but we had partial preset matches, return them
  if (presetMatches.length > 0) {
    return presetMatches;
  }

  return [];
}

/**
 * Reverse geocodes coordinates into a readable address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!isValidCoordinate(lat, lng)) {
    throw new Error('Invalid coordinates for reverse geocoding');
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // ignore
  }

  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function normalizeNominatimResults(data: any[]): GeocodeLocation[] {
  const list: GeocodeLocation[] = [];
  for (const item of data) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isValidCoordinate(lat, lng)) {
      const nameParts = (item.display_name || '').split(',');
      const shortName = nameParts.slice(0, 2).join(',').trim() || item.name || 'Selected Location';
      list.push({
        name: shortName,
        formattedAddress: item.display_name || shortName,
        coordinates: { lat, lng }
      });
    }
  }
  return list;
}
