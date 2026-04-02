import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CispStatisticService } from './cisp-statistic.service';
import { CispStatisticController } from './cisp-statistic.controller';
import { ImportacaoService } from './importacao.service';
import { CispStatistic } from './entities/cisp-statistic.entity';
import { CispArea } from './entities/cisp-area.entity';
import { CispAreaService } from './cisp-area.service';
import { CispAreaController } from './cisp-area.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CispStatistic, CispArea])],
  providers: [CispStatisticService, ImportacaoService, CispAreaService],
  controllers: [CispStatisticController, CispAreaController],
})
export class CispStatisticModule {}
