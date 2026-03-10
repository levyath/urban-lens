import { Module } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { GeocodeController } from './geocode.controller';

@Module({
  providers: [GeocodeService],
  controllers: [GeocodeController]
})
export class GeocodeModule {}
