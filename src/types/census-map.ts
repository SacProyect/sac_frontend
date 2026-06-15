export interface MapLocation {
  id: string;
  taxpayer_id: string;
  commercial_name: string;
  address?: string;
  photo_url?: string;
  latitude: number;
  longitude: number;
  census_status: 'DRAFT' | 'COMPLETED' | 'VERIFIED' | 'IMPORTED';
  data_integrity_status: 'COMPLETE' | 'PENDING_DATA' | 'NOT_VERIFIED';
  fiscal_name?: string | null;
}

export interface MapLocationFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: MapLocation;
}

export interface MapLocationsResponse {
  type: 'FeatureCollection';
  features: MapLocationFeature[];
}

export interface MapQueryParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  status?: string;
  limit?: number;
}

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  locations: MapLocation[];
}
