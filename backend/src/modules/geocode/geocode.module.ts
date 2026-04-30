import { Module } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { GeocodeController } from './geocode.controller';
import { HttpModule } from '@nestjs/axios';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [HttpModule, PlacesModule],
  providers: [GeocodeService],
  controllers: [GeocodeController],
})
export class GeocodeModule {}
