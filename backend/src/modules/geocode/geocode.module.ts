import { Module } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { GeocodeController } from './geocode.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [GeocodeService],
  controllers: [GeocodeController],
})
export class GeocodeModule {}
