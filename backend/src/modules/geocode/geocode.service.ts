import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GeocodeResultDto } from './dto/geocode-result.dto';
import { PlacesService } from '../places/places.service';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

@Injectable()
export class GeocodeService {
  constructor(
    private readonly httpService: HttpService,
    private readonly placesService: PlacesService,
  ) {}

  async geocode(
    address: string,
  ): Promise<{ query: string; count: number; results: GeocodeResultDto[] }> {
    const url = `${process.env.NOMINATIM_URL}/search`;

    const response = await firstValueFrom(
      this.httpService.get<NominatimResult[]>(url, {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'br',
        },
      }),
    );

    return {
      query: address,
      count: response.data.length,
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

  async findNearbyByAddress(address: string, radius: number, types?: string) {
    const geo = await this.geocode(address);

    if (geo.count === 0) {
      throw new NotFoundException(
        `Nenhum endereço encontrado para: ${address}`,
      );
    }

    const first = geo.results[0];

    return this.placesService.findNearby(first.lat, first.lon, radius, types);
  }
}
