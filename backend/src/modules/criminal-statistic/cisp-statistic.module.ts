import { Module } from '@nestjs/common';
import { CispStatisticService } from './cisp-statistic.service';
import { CispStatisticController } from './cisp-statistic.controller';

@Module({
  providers: [CispStatisticService],
  controllers: [CispStatisticController],
})
export class CispStatisticModule {}
