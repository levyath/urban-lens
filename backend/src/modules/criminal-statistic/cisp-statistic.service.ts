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
  total_furtos: number | string;
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
        'stats.total_furtos AS total_furtos',
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
    const totalFurtos = Number(resultado.total_furtos);
    const crimeSafetyStars = this.pontuacaoParaEstrelas(pontuacao);

    // Score normalizado em que 1 representa menor risco e 0 maior risco.
    const crimeSafetyScore = Number((crimeSafetyStars / 5).toFixed(4));

    return {
      sucesso: true,
      delegacia_responsavel: resultado.delegacia,
      indice_risco: this.traduzirPontuacao(pontuacao),
      crime_safety_stars: crimeSafetyStars,
      crime_safety_score: crimeSafetyScore,
      dados_brutos: {
        pontuacao_total: pontuacao,
        letalidade_violenta: letalidade,
        roubos_rua: rouboRua,
        roubos_veiculo: rouboVeiculo,
        total_furtos: totalFurtos,
      },
    };
  }

  private traduzirPontuacao(pontuacao: number): string {
    if (pontuacao >= 8000) return 'MUITO ALTO';
    if (pontuacao >= 4000) return 'ALTO';
    if (pontuacao >= 1500) return 'MÉDIO';
    return 'BAIXO';
  }

  private pontuacaoParaEstrelas(pontuacao: number): number {
    // Quanto maior a pontuação de risco, menor a quantidade de estrelas.
    if (pontuacao >= 8000) return 0;
    if (pontuacao >= 6000) return 1;
    if (pontuacao >= 4000) return 2;
    if (pontuacao >= 2500) return 3;
    if (pontuacao >= 1500) return 4;
    return 5;
  }
}
