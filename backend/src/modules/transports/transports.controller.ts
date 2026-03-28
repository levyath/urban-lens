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
    @Query('page') page = 1,
    @Query('page_size') pageSize = 50,
  ): Promise<NearbyTransportsResult> {
    return await this.transportsService.findNearbyTransports(
      Number(lat),
      Number(long),
      Number(radius),
      Number(page),
      Number(pageSize),
    );
  }
}
