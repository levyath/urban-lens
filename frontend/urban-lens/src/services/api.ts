import axios from 'axios';
import type {
  GeocodeResult,
  PlacesNearbyResponse,
  VulnerabilitySearchOptions,
  TransportResponse,
  VulnerabilityLevelResponse,
  VulnerabilityNearbyResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const geocodeService = {
  async searchAddress(
    address: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<GeocodeResult> {
    const response = await api.get<GeocodeResult>('/geocode', {
      params: { address, page, page_size: pageSize },
    });
    return response.data;
  },

  async nearbyByAddress(
    address: string,
    radius: number = 2000,
    types?: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PlacesNearbyResponse> {
    const response = await api.get<PlacesNearbyResponse>(
      '/geocode/nearby-by-address',
      {
        params: { address, radius, types, page, page_size: pageSize },
      },
    );
    return response.data;
  },
};

export const placesService = {
  async findNearby(
    lat: number,
    lon: number,
    radius: number = 1000,
    type?: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PlacesNearbyResponse> {
    const response = await api.get<PlacesNearbyResponse>('/places/near', {
      params: { lat, lon, radius, type, page, page_size: pageSize },
    });
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<string[]>('/places/categories');
    return response.data;
  },

  async getClusters(): Promise<unknown[]> {
    const response = await api.get<unknown[]>('/places/clusters');
    return response.data;
  },
};

export const transportsService = {
  async findNearby(
    lat: number,
    lon: number,
    radius: number = 1000,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<TransportResponse> {
    const response = await api.get<TransportResponse>('/transports/near', {
      params: { lat, lon, radius, page, page_size: pageSize },
    });
    return response.data;
  },
};

export const vulnerabilityService = {
  async getLevel(lat: number, lon: number): Promise<VulnerabilityLevelResponse> {
    const response = await api.get<VulnerabilityLevelResponse>('/vulnerability', {
      params: { lat, lon },
    });
    return response.data;
  },

  async findNearby(
    lat: number,
    lon: number,
    radius: number = 1000,
    options: VulnerabilitySearchOptions = {},
  ): Promise<VulnerabilityNearbyResponse> {
    const {
      page = 1,
      pageSize = 50,
      sortBy,
      sortOrder,
      bairro,
      ra,
      codAp,
      situacao,
      complexo,
    } = options;

    const response = await api.get<VulnerabilityNearbyResponse>(
      '/vulnerability/near',
      {
        params: {
          lat,
          lon,
          radius,
          page,
          page_size: pageSize,
          sortBy,
          sortOrder,
          bairro,
          ra,
          codAp,
          situacao,
          complexo,
        },
      },
    );
    return response.data;
  },

  async getLevelAndNearby(
    lat: number,
    lon: number,
    radius: number = 1500,
    options: VulnerabilitySearchOptions = {},
  ): Promise<{
    level: VulnerabilityLevelResponse;
    nearby: VulnerabilityNearbyResponse;
  }> {
    const [level, nearby] = await Promise.all([
      this.getLevel(lat, lon),
      this.findNearby(lat, lon, radius, options),
    ]);

    return {
      level,
      nearby,
    };
  },
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const details = error.response?.data;

    if (typeof details === 'string') {
      return status ? `${fallback} (${status}): ${details}` : `${fallback}: ${details}`;
    }

    if (details && typeof details === 'object' && 'message' in details) {
      const message = (details as { message?: unknown }).message;
      if (typeof message === 'string') {
        return status ? `${fallback} (${status}): ${message}` : `${fallback}: ${message}`;
      }
    }

    if (error.message) {
      return `${fallback}: ${error.message}`;
    }
  }

  if (error instanceof Error) {
    return `${fallback}: ${error.message}`;
  }

  return fallback;
};
