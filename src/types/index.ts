// Satellite type definitions

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

export interface SatellitePosition {
  id: string;
  name: string;
  lat: number;
  lng: number;
  alt: number; // km
  velocity: number; // km/s
  tle: TLEData;
  // Extended telemetry
  inclination?: number;
  period?: number; // minutes
  noradId?: string;
  orbitType?: 'LEO' | 'MEO' | 'GEO' | 'HEO';
}

export interface SatelliteCategory {
  id: string;
  name: string;
  url: string;
  color: string;
}

export interface GlobeSettings {
  showAtmosphere: boolean;
  showStars: boolean;
  showOrbits: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
}

export interface AppState {
  simulationTime: Date;
  isRealTime: boolean;
  timeMultiplier: number;
}
