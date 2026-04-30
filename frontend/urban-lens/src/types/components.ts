import type { LatLngExpression } from 'leaflet';
import type {
  PlacesNearbyResponse,
  SortOrder,
  TransportResponse,
  VulnerabilityLevelResponse,
  VulnerabilityNearbyResponse,
  VulnerabilitySortBy,
} from './index';

export interface MapProps {
  center: LatLngExpression;
  zoom?: number;
  markers?: MarkerData[];
  onMapClick?: (lat: number, lng: number) => void;
}

export interface MarkerData {
  id: string;
  position: LatLngExpression;
  title: string;
  description?: string;
}

export interface SearchBarProps {
  onSelectAddress: (result: import('./index').GeocodeResultItem) => void;
  placeholder?: string;
}

export type AnalysisStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PaginationState {
  placesPage: number;
  transportsPage: number;
  vulnerabilityPage: number;
  pageSize: number;
}

export interface FiltersState {
  radius: number;
  selectedType: string;
  vulnerabilitySortBy: VulnerabilitySortBy;
  vulnerabilitySortOrder: SortOrder;
  vulnerabilityBairro: string;
}

export interface AnalysisPanelProps {
  selectedPointLabel: string;
  searchAddressLabel: string;
  hasSelectedPoint: boolean;
  analysisStatus: AnalysisStatus;
  error: string | null;
  analysisError: string | null;
  filters: FiltersState;
  pagination: PaginationState;
  places: PlacesNearbyResponse | null;
  transports: TransportResponse | null;
  vulnerabilityLevel: VulnerabilityLevelResponse | null;
  vulnerabilityNearby: VulnerabilityNearbyResponse | null;
  onRadiusChange: (value: number) => void;
  onSelectedTypeChange: (value: string) => void;
  onVulnerabilitySortByChange: (value: VulnerabilitySortBy) => void;
  onVulnerabilitySortOrderChange: (value: SortOrder) => void;
  onVulnerabilityBairroChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
  onApplyFilters: () => void;
  onReset: () => void;
  onPlacesPageChange: (nextPage: number) => void;
  onTransportsPageChange: (nextPage: number) => void;
  onVulnerabilityPageChange: (nextPage: number) => void;
}
