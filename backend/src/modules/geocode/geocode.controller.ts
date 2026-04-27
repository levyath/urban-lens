import { Controller, Get, Query } from '@nestjs/common';
import { GeocodeService } from './geocode.service';

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  geocode(
    @Query('address') address: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 10,
  ) {
    return this.geocodeService.geocode(address, Number(page), Number(pageSize));
  }
}
