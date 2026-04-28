export * from './components';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodeResultItem {
  address: string;
  lat: number;
  lon: number;
  boundingBox: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}

export interface GeocodeResult {
  query: string;
  count: number;
  page: number;
  page_size: number;
  offset: number;
  results: GeocodeResultItem[];
}

export interface Place {
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
}

export interface PlacesNearbyResponse {
  summary: {
    radius_meters: number;
    type_filter: string | null;
    total: number;
    returned_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  data: Place[];
}

export type TransportType = 'bus_stop' | 'train_station' | 'subway_entrance';

export interface TransportPoint {
  name: string;
  lat: number;
  lon: number;
  distance: number;
  type: TransportType;
  walk_time_minutes: number;
}

export interface TransportResponse {
  summary: {
    radius_meters: number;
    total: number;
    returned_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  counts: {
    bus_stops: number;
    train_stations: number;
    subway_entrances: number;
  };
  raw_score: number;
  transport_score: number;
  nearest_transport: {
    type: string;
    distance_meters: number;
    walk_time_minutes: number;
    name: string;
  } | null;
  data: {
    bus_stops: TransportPoint[];
    train_stations: TransportPoint[];
    subway_entrances: TransportPoint[];
  };
}

export interface VulnerabilityArea {
  id: number;
  name: string;
  municipality: string | null;
  uf: string | null;
  bairro: string | null;
  ra: string | null;
  rp: string | null;
  cod_ap: number | null;
  complexo: string | null;
  situacao: number | null;
  pop_sabren: number | null;
  dom_sabren: number | null;
  fonte: string | null;
  lat: number;
  lon: number;
  distance_meters: number;
  is_inside: boolean;
  vulnerability_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VulnerabilityLevelResponse {
  distance_to_vulnerability_area: number | null;
  vulnerability_level: 'LOW' | 'MEDIUM' | 'HIGH';
  nearest_area: {
    id: number;
    name: string;
    bairro: string | null;
    complexo: string | null;
    cod_ap: number | null;
    situacao: number | null;
    pop_sabren: number | null;
    dom_sabren: number | null;
    distance_meters: number;
  } | null;
}

export interface VulnerabilityNearbyResponse {
  summary: {
    radius_meters: number;
    total: number;
    returned_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    sort_by: string;
    sort_order: string;
    total_population_sabren: number;
    total_households_sabren: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    inside_count: number;
    nearest_distance_meters: number | null;
    dominant_vulnerability_level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    vulnerability_score: number;
  };
  nearest_vulnerability_area: VulnerabilityArea | null;
  data: VulnerabilityArea[];
}

export type VulnerabilitySortBy =
  | 'relevance'
  | 'distance_meters'
  | 'name'
  | 'bairro'
  | 'ra'
  | 'complexo'
  | 'situacao'
  | 'pop_sabren'
  | 'dom_sabren'
  | 'is_inside'
  | 'vulnerability_level';

export type SortOrder = 'asc' | 'desc';

export interface VulnerabilitySearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: VulnerabilitySortBy;
  sortOrder?: SortOrder;
  bairro?: string;
  ra?: string;
  codAp?: number;
  situacao?: number;
  complexo?: string;
}
