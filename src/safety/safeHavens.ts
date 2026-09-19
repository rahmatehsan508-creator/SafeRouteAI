import { Coordinates } from '../types';

export interface SafeHaven {
  id: string;
  name: string;
  type: 'police' | 'pharmacy_247' | 'hospital' | 'transit_hub' | 'convenience_247';
  typeLabel: string;
  coordinates: Coordinates;
  distanceMeters?: number;
  distanceFormatted?: string;
  address: string;
  isOpen247: boolean;
  phone?: string;
}

export interface SafetyZone {
  id: string;
  name: string;
  center: Coordinates;
  radiusMeters: number;
  safetyRating: number; // 0 - 100
  level: 'high_safety' | 'moderate' | 'caution';
  description: string;
}

/**
 * Generates realistic nearby safe havens around a given anchor coordinate (user GPS or origin)
 */
export function getNearbySafeHavens(center: Coordinates): SafeHaven[] {
  const { lat, lng } = center;

  const havens: SafeHaven[] = [
    {
      id: 'haven-police-1',
      name: 'Central Police Station & Safe Post',
      type: 'police',
      typeLabel: 'Police Station',
      coordinates: { lat: lat + 0.0028, lng: lng + 0.0035 },
      address: '24/7 Staffed Police Post & SOS Call Box',
      isOpen247: true,
      phone: '112'
    },
    {
      id: 'haven-pharm-1',
      name: 'Apotek 24/7 Safe Haven Pharmacy',
      type: 'pharmacy_247',
      typeLabel: '24/7 Pharmacy',
      coordinates: { lat: lat - 0.0022, lng: lng + 0.0041 },
      address: 'Open 24 Hours • Well-lit CCTV monitored storefront',
      isOpen247: true,
      phone: '+46 8 123 456'
    },
    {
      id: 'haven-hosp-1',
      name: 'City Emergency Medical Center',
      type: 'hospital',
      typeLabel: 'Emergency Hospital',
      coordinates: { lat: lat + 0.0048, lng: lng - 0.0032 },
      address: 'Emergency Entrance • Active Security 24/7',
      isOpen247: true,
      phone: '112'
    },
    {
      id: 'haven-transit-1',
      name: 'Metro Transit Terminal & Guardian Post',
      type: 'transit_hub',
      typeLabel: 'Transit Hub',
      coordinates: { lat: lat - 0.0035, lng: lng - 0.0025 },
      address: 'Transit Safety Patrol & Well-lit Concourse',
      isOpen247: true,
      phone: '+46 8 987 654'
    },
    {
      id: 'haven-store-1',
      name: '7-Eleven 24/7 Guardian Store',
      type: 'convenience_247',
      typeLabel: '24/7 Lit Store',
      coordinates: { lat: lat + 0.0015, lng: lng - 0.0020 },
      address: 'Illuminated storefront with emergency phone access',
      isOpen247: true,
      phone: '+46 8 555 123'
    }
  ];

  return havens;
}

/**
 * Generates dynamic safety zones around the center point for the Safety Heatmap overlay
 */
export function getSafetyZones(center: Coordinates): SafetyZone[] {
  const { lat, lng } = center;

  return [
    {
      id: 'zone-high-1',
      name: 'Commercial Boulevard Safe Corridor',
      center: { lat: lat + 0.0015, lng: lng + 0.0020 },
      radiusMeters: 380,
      safetyRating: 94,
      level: 'high_safety',
      description: 'Continuous LED lighting, high pedestrian presence, 24/7 CCTV surveillance'
    },
    {
      id: 'zone-high-2',
      name: 'Civic Center & Transit Plaza',
      center: { lat: lat - 0.0025, lng: lng - 0.0018 },
      radiusMeters: 320,
      safetyRating: 91,
      level: 'high_safety',
      description: 'Active security patrols, emergency call boxes, open storefronts'
    },
    {
      id: 'zone-mod-1',
      name: 'Residential Quiet Avenue',
      center: { lat: lat + 0.0038, lng: lng - 0.0030 },
      radiusMeters: 300,
      safetyRating: 78,
      level: 'moderate',
      description: 'Moderate street lighting, low foot traffic at late night'
    },
    {
      id: 'zone-caution-1',
      name: 'Industrial Depot / Dim Backway',
      center: { lat: lat - 0.0040, lng: lng + 0.0042 },
      radiusMeters: 280,
      safetyRating: 54,
      level: 'caution',
      description: 'Low lighting, isolated alleyway segments, avoid during late hours'
    }
  ];
}
