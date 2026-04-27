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

@Injectable()
export class GeocodeService {
  constructor(private readonly httpService: HttpService) {}

  async geocode(
    address: string,
    page = 1,
    pageSize = 5,
  ): Promise<{
    query: string;
    count: number;
    page: number;
    page_size: number;
    offset: number;
    results: GeocodeResultDto[];
  }> {
    const url = `${process.env.NOMINATIM_URL}/search`;

    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);

    const safePage = Number.isFinite(pageNumber) ? Math.max(1, pageNumber) : 1;
    const safePageSize = Number.isFinite(pageSizeNumber)
      ? Math.min(Math.max(1, pageSizeNumber), 50)
      : 5;
    const offset = (safePage - 1) * safePageSize;

    const response = await firstValueFrom(
      this.httpService.get<NominatimResult[]>(url, {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: safePageSize,
          offset,
          countrycodes: 'br',
        },
      }),
    );

    return {
      query: address,
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
