import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'node:fs/promises';
import { CispArea } from './entities/cisp-area.entity';

interface GeoJsonFeature {
  properties: Record<string, unknown>;
  geometry: unknown;
}

interface GeoJson {
  features: GeoJsonFeature[];
}

@Injectable()
export class CispAreaService {
  private readonly logger = new Logger(CispAreaService.name);

  constructor(
    @InjectRepository(CispArea)
    private readonly cispAreaRepo: Repository<CispArea>,
  ) {}

  async importarGeoJsonCisp(caminhoArquivo: string): Promise<string> {
    this.logger.log(`Iniciando leitura do GeoJSON: ${caminhoArquivo}`);

    const rawData = await fs.readFile(caminhoArquivo, 'utf-8');
    const geojson = JSON.parse(rawData) as GeoJson;

    let inseridos = 0;
    let ignorados = 0;

    for (const feature of geojson.features) {
      const props = feature.properties;

      const cispNumeroRaw = props['CISP'] ?? props['cisp'];
      const cispId =
        typeof cispNumeroRaw === 'number'
          ? cispNumeroRaw
          : typeof cispNumeroRaw === 'string'
            ? Number(cispNumeroRaw.trim())
            : Number.NaN;

      const nomeDp =
        (props.NOME as string) ||
        (props.nome as string) ||
        (props.Label as string) ||
        `Delegacia ${Number.isFinite(cispId) ? cispId : ''}`;

      if (!Number.isInteger(cispId)) {
        ignorados++;
        continue;
      }

      const geomString = JSON.stringify(feature.geometry);

      try {
        await this.cispAreaRepo
          .createQueryBuilder()
          .insert()
          .into(CispArea)
          .values({
            cispId,
            nome: nomeDp,
            geom: () => 'ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))',
          })
          .onConflict(
            '(cisp_id) DO UPDATE SET geom = EXCLUDED.geom, nome = EXCLUDED.nome',
          )
          .setParameters({ geom: geomString })
          .execute();
        inseridos++;
      } catch (error: unknown) {
        this.logger.error(
          `Erro ao salvar a CISP ${cispId}:`,
          error instanceof Error
            ? `${error.message}\n${error.stack ?? ''}`
            : String(error),
        );
      }
    }

    const mensagem = `Importação concluída! ${inseridos} áreas inseridas/atualizadas e ${ignorados} ignoradas.`;
    this.logger.log(mensagem);

    return mensagem;
  }
}
