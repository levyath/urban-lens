import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CispArea } from './entities/cisp-area.entity';
import { CispStatistic } from './entities/cisp-statistic.entity';

interface CispRiskRow {
  delegacia: string;
  pontuacao: number | string;
  letalidade: number | string;
  roubo_rua: number | string;
  roubo_veiculo: number | string;
}

@Injectable()
export class CispStatisticService {
  private readonly logger = new Logger(CispStatisticService.name);

  constructor(
    @InjectRepository(CispArea)
    private readonly cispAreaRepo: Repository<CispArea>,
    @InjectRepository(CispStatistic)
    private readonly cispStatisticRepo: Repository<CispStatistic>,
  ) {}

  async calcularRiscoPorCoordenada(lat: number, lng: number) {
    this.logger.log(
      `Calculando risco para a coordenada: Lat ${lat}, Lng ${lng}`,
    );

    // A consulta matadora do PostGIS usando TypeORM
    const resultado = await this.cispStatisticRepo
      .createQueryBuilder('stats')
      .innerJoin(CispArea, 'area', 'area.cisp_id = stats.cisp')
      .select([
        'area.nome AS delegacia',
        'stats.pontuacao_risco AS pontuacao',
        'stats.letalidade_violenta AS letalidade',
        'stats.roubo_rua AS roubo_rua',
        'stats.roubo_veiculo AS roubo_veiculo',
      ])
      .where(
        `ST_Intersects(
          area.geom,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        )`,
        { lng, lat },
      )
      .getRawOne<CispRiskRow>();

    if (!resultado) {
      return {
        sucesso: false,
        mensagem:
          'Coordenada fora da área de cobertura criminal (Estado do RJ).',
      };
    }

    const pontuacao = Number(resultado.pontuacao);
    const letalidade = Number(resultado.letalidade);
    const rouboRua = Number(resultado.roubo_rua);
    const rouboVeiculo = Number(resultado.roubo_veiculo);

    return {
      sucesso: true,
      delegacia_responsavel: resultado.delegacia,
      indice_risco: this.traduzirPontuacao(pontuacao),
      dados_brutos: {
        pontuacao_total: pontuacao,
        letalidade_violenta: letalidade,
        roubos_rua: rouboRua,
        roubos_veiculo: rouboVeiculo,
      },
    };
  }

  private traduzirPontuacao(pontuacao: number): string {
    if (pontuacao >= 8000) return 'MUITO ALTO';
    if (pontuacao >= 4000) return 'ALTO';
    if (pontuacao >= 1500) return 'MÉDIO';
    return 'BAIXO';
  }
}
