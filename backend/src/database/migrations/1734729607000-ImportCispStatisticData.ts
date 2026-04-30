import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class ImportCispStatisticData1734729607000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📥 Importando dados de estatísticas criminais CISP...');

    // Caminho para o arquivo CSV
    const csvPath = path.join(__dirname, '../../../src/data/dados-isp.csv');

    // Verificar se o arquivo existe
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  Arquivo CSV não encontrado:', csvPath);
      console.log('   Pulando importação de dados.');
      return;
    }

    console.log('  ✓ Arquivo CSV encontrado');

    // Ler o arquivo CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length <= 1) {
      console.log('⚠️  Arquivo CSV vazio ou sem dados');
      return;
    }

    // Pular o cabeçalho
    const dataLines = lines.slice(1);
    console.log(`  ✓ ${dataLines.length} linhas encontradas`);

    // Estrutura para agregar dados por CISP
    const cispData: Record<
      number,
      {
        letalidadeViolenta: number;
        rouboRua: number;
        rouboVeiculo: number;
        totalFurtos: number;
      }
    > = {};

    let processedLines = 0;
    let skippedLines = 0;

    console.log('  ⏳ Processando dados (filtrando ano >= 2025)...');

    for (const line of dataLines) {
      try {
        // Parse CSV com separador ";"
        const columns = line.split(';').map((col) => col.replace(/"/g, '').trim());

        const cisp = parseInt(columns[0]);
        const ano = parseInt(columns[2]);

        // Filtrar apenas dados de 2025 em diante
        if (isNaN(ano) || ano < 2025) {
          skippedLines++;
          continue;
        }

        if (isNaN(cisp)) {
          skippedLines++;
          continue;
        }

        // Extrair dados relevantes
        const letalidadeViolenta = parseInt(columns[15]) || 0; // letalidade_violenta
        const rouboRua = parseInt(columns[20]) || 0; // roubo_rua
        const rouboVeiculo = parseInt(columns[21]) || 0; // roubo_veiculo
        const totalFurtos = parseInt(columns[42]) || 0; // total_furtos

        // Agregar por CISP
        if (!cispData[cisp]) {
          cispData[cisp] = {
            letalidadeViolenta: 0,
            rouboRua: 0,
            rouboVeiculo: 0,
            totalFurtos: 0,
          };
        }

        cispData[cisp].letalidadeViolenta += letalidadeViolenta;
        cispData[cisp].rouboRua += rouboRua;
        cispData[cisp].rouboVeiculo += rouboVeiculo;
        cispData[cisp].totalFurtos += totalFurtos;

        processedLines++;
      } catch (error) {
        skippedLines++;
      }
    }

    console.log(`  ✓ ${processedLines} linhas processadas`);
    console.log(`  ✓ ${skippedLines} linhas ignoradas (ano < 2025 ou inválidas)`);
    console.log(`  ✓ ${Object.keys(cispData).length} delegacias CISP encontradas`);

    // Inserir dados agregados
    let inserted = 0;
    console.log('  ⏳ Inserindo dados agregados...');

    for (const [cisp, data] of Object.entries(cispData)) {
      const pontuacaoRisco =
        data.letalidadeViolenta * 3 +
        (data.rouboRua + data.rouboVeiculo) * 2 +
        data.totalFurtos;

      await queryRunner.query(
        `
        INSERT INTO cisp_statistic (cisp, letalidade_violenta, roubo_rua, roubo_veiculo, total_furtos, pontuacao_risco)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (cisp) DO UPDATE SET
          letalidade_violenta = EXCLUDED.letalidade_violenta,
          roubo_rua = EXCLUDED.roubo_rua,
          roubo_veiculo = EXCLUDED.roubo_veiculo,
          total_furtos = EXCLUDED.total_furtos,
          pontuacao_risco = EXCLUDED.pontuacao_risco
        `,
        [cisp, data.letalidadeViolenta, data.rouboRua, data.rouboVeiculo, data.totalFurtos, pontuacaoRisco]
      );

      inserted++;

      if (inserted % 10 === 0) {
        console.log(`    → ${inserted} delegacias inseridas...`);
      }
    }

    console.log(`✅ Importação concluída!`);
    console.log(`   • ${inserted} delegacias CISP inseridas`);

    // Mostrar estatísticas
    const stats = await queryRunner.query(`
      SELECT 
        COUNT(*) as total,
        MAX(pontuacao_risco) as max_risco,
        MIN(pontuacao_risco) as min_risco,
        AVG(pontuacao_risco)::int as avg_risco
      FROM cisp_statistic;
    `);

    if (stats.length > 0) {
      console.log(`   • Total: ${stats[0].total} delegacias`);
      console.log(`   • Risco máximo: ${stats[0].max_risco}`);
      console.log(`   • Risco mínimo: ${stats[0].min_risco}`);
      console.log(`   • Risco médio: ${stats[0].avg_risco}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Removendo dados de estatísticas criminais...');

    await queryRunner.query(`TRUNCATE TABLE cisp_statistic;`);

    console.log('✅ Dados removidos');
  }
}
