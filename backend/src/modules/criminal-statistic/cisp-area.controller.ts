import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CispAreaService } from './cisp-area.service';

@Controller('cisp-area')
export class CispAreaController {
  constructor(private readonly cispAreaService: CispAreaService) {}

  @Post('importar')
  @HttpCode(HttpStatus.OK)
  async importarMapaCisp() {
    const arquivoAlvo = './src/data/cisp-mapa.json';

    const resultado =
      await this.cispAreaService.importarGeoJsonCisp(arquivoAlvo);

    return {
      sucesso: true,
      mensagem: resultado,
    };
  }
}
