import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import csv from 'csv-parser';
import { CispStatistic } from './entities/cisp-statistic.entity';

interface CsvCrimeRow {
  ano?: string;
  cisp?: string;
  letalidade_violenta?: string;
  roubo_rua?: string;
  roubo_veiculo?: string;
  total_furtos?: string;
}

@Injectable()
export class ImportacaoService {
  private readonly logger = new Logger(ImportacaoService.name);

  constructor(
    @InjectRepository(CispStatistic)
    private readonly estatisticaRepo: Repository<CispStatistic>,
  ) {}

  private toInt(value: string | undefined): number {
    const parsed = Number.parseInt(value ?? '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  async importarDados(caminhoArquivo: string): Promise<string> {
    this.logger.log(`Iniciando leitura do arquivo: ${caminhoArquivo}`);

    // Acumulador em memoria (chave: cisp, valor: estatistica agregada)
    const acumulador = new Map<number, CispStatistic>();

    return new Promise((resolve, reject) => {
      fs.createReadStream(caminhoArquivo)
        .pipe(csv({ separator: ';' }))
        .on('data', (linha: CsvCrimeRow) => {
          const ano = this.toInt(linha.ano);
          const cisp = this.toInt(linha.cisp);

          // Ignora linhas invalidas e usa apenas dados recentes.
          if (!Number.isNaN(cisp) && ano >= 2025) {
            if (!acumulador.has(cisp)) {
              acumulador.set(
                cisp,
                this.estatisticaRepo.create({
                  cisp,
                  letalidadeViolenta: 0,
                  rouboRua: 0,
                  rouboVeiculo: 0,
                  totalFurtos: 0,
                  pontuacaoRisco: 0,
                }),
              );
            }

            const stats = acumulador.get(cisp);
            if (!stats) {
              return;
            }

            stats.letalidadeViolenta += this.toInt(linha.letalidade_violenta);
            stats.rouboRua += this.toInt(linha.roubo_rua);
            stats.rouboVeiculo += this.toInt(linha.roubo_veiculo);
            stats.totalFurtos += this.toInt(linha.total_furtos);
          }
        })
        .on('end', () => {
          this.logger.log(
            `Leitura concluida. Processando ${acumulador.size} delegacias...`,
          );

          const registrosProntos = Array.from(acumulador.values()).map(
            (stats) => {
              stats.pontuacaoRisco =
                stats.letalidadeViolenta * 3 +
                (stats.rouboRua + stats.rouboVeiculo) * 2 +
                stats.totalFurtos;

              return stats;
            },
          );

          void this.estatisticaRepo
            .save(registrosProntos)
            .then(() => {
              this.logger.log('Sincronizacao com o PostgreSQL concluida!');
              resolve(
                `Dados de ${registrosProntos.length} delegacias importados com sucesso.`,
              );
            })
            .catch((error: unknown) => {
              this.logger.error('Erro ao salvar no banco de dados', error);
              reject(this.toError(error));
            });
        })
        .on('error', (error: unknown) => {
          this.logger.error('Erro ao abrir o arquivo CSV', error);
          reject(this.toError(error));
        });
    });
  }
}
