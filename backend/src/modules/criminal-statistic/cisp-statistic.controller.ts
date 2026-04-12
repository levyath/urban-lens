import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ImportacaoService } from './importacao.service';
import { CispStatisticService } from './cisp-statistic.service';

@Controller('cisp-statistic')
export class CispStatisticController {
  constructor(
    private readonly importacaoService: ImportacaoService,
    private readonly cispStatisticService: CispStatisticService,
  ) {}

  @Post('importar')
  @HttpCode(HttpStatus.OK)
  async importarCsv() {
    const arquivoAlvo = './src/data/dados-isp.csv';

    const resultado = await this.importacaoService.importarDados(arquivoAlvo);

    return {
      sucesso: true,
      mensagem: resultado,
    };
  }

  @Get('local')
  async analisarLocal(@Query('lat') lat: string, @Query('lon') lon: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException(
        'Latitude e Longitude são obrigatórias e devem ser números válidos.',
      );
    }

    return await this.cispStatisticService.calcularRiscoPorCoordenada(
      latitude,
      longitude,
    );
  }
}
