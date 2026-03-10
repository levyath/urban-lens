import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable()
export class GeocodeService {
  constructor(private httpService: HttpService) {}

  async geocode(
    address: string,
  ): Promise<
    { address: string; lat: string; lon: string } | { message: string }
  > {
    const url = 'https://nominatim.openstreetmap.org/search';

    const response = await firstValueFrom(
      this.httpService.get<NominatimResult[]>(url, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'geoscope-app',
        },
      }),
    );

    const result = response.data[0];

    if (!result) {
      return { message: 'Endereço não encontrado' };
    }

    return {
      address: result.display_name,
      lat: result.lat,
      lon: result.lon,
    };
  }
}
