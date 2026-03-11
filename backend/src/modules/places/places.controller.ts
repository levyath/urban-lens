import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('near')
  async findNearby(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('radius') radius = 1000,
    @Query('type') type?: string,
  ): Promise<unknown[]> {
    return this.placesService.findNearby(
      Number(lat),
      Number(lon),
      Number(radius),
      type,
    );
  }

  // # TODO: limpar o retorno para aqueles desejados por nosso projeto
  @Get('categories')
  async getCategories(): Promise<unknown[]> {
    return this.placesService.getCategories();
  }
}
