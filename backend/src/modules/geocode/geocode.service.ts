import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GeocodeResultDto } from './dto/geocode-result.dto';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

interface GeocodeQuery {
  address?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  country?: string;
  postalcode?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class GeocodeService {
  constructor(private readonly httpService: HttpService) {}

  async geocode(query: GeocodeQuery): Promise<{
    query: string;
    count: number;
    page: number;
    page_size: number;
    offset: number;
    results: GeocodeResultDto[];
  }> {
    const url = `${process.env.NOMINATIM_URL}/search`;

    const pageNumber = Number(query.page ?? 1);
    const pageSizeNumber = Number(query.pageSize ?? 5);

    const safePage = Number.isFinite(pageNumber) ? Math.max(1, pageNumber) : 1;
    const safePageSize = Number.isFinite(pageSizeNumber)
      ? Math.min(Math.max(1, pageSizeNumber), 50)
      : 5;
    const offset = (safePage - 1) * safePageSize;

    const hasStructuredQuery = [
      query.street,
      query.number,
      query.city,
      query.state,
      query.country,
      query.postalcode,
    ].some(Boolean);

    const params: Record<string, string | number> = {
      format: 'jsonv2',
      addressdetails: 1,
      limit: safePageSize,
      offset,
      countrycodes: 'br',
    };

    if (hasStructuredQuery) {
      const streetParts = [query.number, query.street].filter(Boolean);

      if (streetParts.length > 0) {
        params.street = streetParts.join(' ');
      }

      if (query.city) {
        params.city = query.city;
      }

      if (query.state) {
        params.state = query.state;
      }

      if (query.country) {
        params.country = query.country;
      }

      if (query.postalcode) {
        params.postalcode = query.postalcode;
      }
    } else {
      params.q = query.address ?? '';
    }

    const response = await firstValueFrom(
      this.httpService.get<NominatimResult[]>(url, {
        params,
      }),
    );

    return {
      query: hasStructuredQuery
        ? [
            query.number,
            query.street,
            query.city,
            query.state,
            query.country,
            query.postalcode,
          ]
            .filter(Boolean)
            .join(', ')
        : (query.address ?? ''),
      count: response.data.length,
      page: safePage,
      page_size: safePageSize,
      offset,
      results: response.data.map((item) => ({
        address: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
        boundingBox: {
          south: Number(item.boundingbox[0]),
          north: Number(item.boundingbox[1]),
          west: Number(item.boundingbox[2]),
          east: Number(item.boundingbox[3]),
        },
      })),
    };
  }
}
