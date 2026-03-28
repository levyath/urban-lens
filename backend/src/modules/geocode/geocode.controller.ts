import { Controller, Get, Query } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { PlacesNearbyResult } from '../places/places.service';

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  geocode(@Query('address') address: string) {
    return this.geocodeService.geocode(address);
  }

  @Get('nearby-by-address')
  async nearbyByAddress(
    @Query('address') address: string,
    @Query('radius') radius = '2000',
    @Query('types') types?: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 50,
  ): Promise<PlacesNearbyResult> {
    return this.geocodeService.findNearbyByAddress(
      address,
      Number(radius),
      types,
      Number(page),
      Number(pageSize),
    );
  }
}
