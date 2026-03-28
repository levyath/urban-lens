import { Controller, Get, Query } from '@nestjs/common';
import { PlacesNearbyResult, PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('near')
  async findNearby(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('radius') radius = 1000,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 50,
  ): Promise<PlacesNearbyResult> {
    return this.placesService.findNearby(
      Number(lat),
      Number(lon),
      Number(radius),
      type,
      Number(page),
      Number(pageSize),
    );
  }

  @Get('categories')
  async getCategories(): Promise<unknown[]> {
    return this.placesService.getCategories();
  }

  @Get('clusters')
  async clusters(): Promise<unknown[]> {
    return this.placesService.getClusters();
  }
}
