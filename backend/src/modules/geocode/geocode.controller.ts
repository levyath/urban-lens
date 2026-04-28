import { Controller, Get, Query } from '@nestjs/common';
import { GeocodeService } from './geocode.service';

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  geocode(
    @Query('address') address?: string,
    @Query('street') street?: string,
    @Query('number') number?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('postalcode') postalcode?: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 10,
  ) {
    return this.geocodeService.geocode({
      address,
      street,
      number,
      city,
      state,
      country,
      postalcode,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }
}
