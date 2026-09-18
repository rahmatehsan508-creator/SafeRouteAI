export type TravelMode = 'walking' | 'cycling' | 'two_wheeler' | 'car' | 'public_transport';

export type RoutePreference = 'fastest' | 'balanced' | 'safest';

export type ReportCategory = 
  | 'Poor Lighting' 
  | 'Road Damage' 
  | 'Reported Incident' 
  | 'Isolated Area' 
  | 'Heavy Crowd' 
  | 'Other';

export type ReportStatus = 'Reported' | 'Under Review' | 'Community Confirmed' | 'Verified';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  isCalibrated?: boolean;
  calibratedAddress?: string;
  isEstimatedIsp?: boolean;
  isLocked?: boolean;
}

export interface GeocodeLocation {
  name: string;
  formattedAddress: string;
  coordinates: Coordinates;
}

export interface SafetyFactors {
  lighting: number;              // 0 - 100
  incidentRisk: number;          // 0 - 100 (100 = minimal risk / very safe)
  publicPresence: number;        // 0 - 100
  roadCondition: number;         // 0 - 100
  isolation: number;             // 0 - 100 (100 = lowest isolation / highly connected)
  emergencyAccessibility: number;// 0 - 100
  communityReportPenalty: number;// deducted points based on nearby unresolved reports
  timeOfDayMultiplier: number;   // e.g. 0.85 for midnight, 1.0 for daytime
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
  maneuverType: string;
  maneuverModifier?: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface NavigationProgress {
  currentCoords: Coordinates;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  currentStepIndex: number;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  isOffRoute: boolean;
  offRouteDistanceMeters: number;
  distanceTraveledMeters: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationFormatted: string;
  coordinates: [number, number][]; // Leaflet format: [lat, lng][]
  safetyScore: number;             // Deterministic score 0 - 100
  safetyFactors: SafetyFactors;
  keyPositives: string[];
  keyConcerns: string[];
  preferenceFit: string;
  isRecommendedForPreference?: boolean;
  steps?: RouteStep[];
  impliedSpeedKmh?: number;
}

export interface CommunityReport {
  id: string;
  userId: string;
  userName?: string;
  category: ReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: ReportStatus;
  confirmations: number;
}

export interface SavedRoute {
  id: string;
  userId: string;
  source: string;
  destination: string;
  sourceCoords: Coordinates;
  destCoords: Coordinates;
  travelMode: TravelMode;
  routePreference: RoutePreference;
  distance: string;
  duration: string;
  safetyScore: number;
  createdAt: number;
}

export interface RouteAIExplanation {
  summary: string;
  safetyBreakdown: string;
  timeContext: string;
  recommendations: string[];
  isAiGenerated: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: number;
}
