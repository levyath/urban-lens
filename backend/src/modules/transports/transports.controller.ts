import { Controller, Get, Query } from '@nestjs/common';
import {
  TransportsService,
  NearbyTransportsResult,
} from './transports.service';

@Controller('transports')
export class TransportsController {
  constructor(private readonly transportsService: TransportsService) {}

  @Get('near')
  async findNearbyTransports(
    @Query('lat') lat: number,
    @Query('lon') long: number,
    @Query('radius') radius = 1000,
  ): Promise<NearbyTransportsResult> {
    return await this.transportsService.findNearbyTransports(
      Number(lat),
      Number(long),
      Number(radius),
    );
  }
}
