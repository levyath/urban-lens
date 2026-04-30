import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCispStatisticTable1734729605000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🏗️  Criando tabela cisp_statistic...');

    // Criar tabela de estatísticas criminais por CISP
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cisp_statistic (
        cisp INT PRIMARY KEY,
        letalidade_violenta INT DEFAULT 0,
        roubo_rua INT DEFAULT 0,
        roubo_veiculo INT DEFAULT 0,
        total_furtos INT DEFAULT 0,
        pontuacao_risco INT DEFAULT 0
      );
    `);
    console.log('  ✓ Tabela cisp_statistic criada');

    // Índice para ordenação por pontuação de risco
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cisp_statistic_pontuacao
        ON cisp_statistic (pontuacao_risco DESC);
    `);
    console.log('  ✓ idx_cisp_statistic_pontuacao');

    // Comentários nas colunas para documentação
    await queryRunner.query(`
      COMMENT ON TABLE cisp_statistic IS 'Estatísticas criminais agregadas por delegacia CISP';
      COMMENT ON COLUMN cisp_statistic.cisp IS 'Número identificador da delegacia CISP';
      COMMENT ON COLUMN cisp_statistic.letalidade_violenta IS 'Total de homicídios (peso 3)';
      COMMENT ON COLUMN cisp_statistic.roubo_rua IS 'Total de roubos na rua (peso 2)';
      COMMENT ON COLUMN cisp_statistic.roubo_veiculo IS 'Total de roubos de veículos (peso 2)';
      COMMENT ON COLUMN cisp_statistic.total_furtos IS 'Total de furtos (peso 1)';
      COMMENT ON COLUMN cisp_statistic.pontuacao_risco IS 'Pontuação calculada: (letalidade * 3) + ((roubo_rua + roubo_veiculo) * 2) + total_furtos';
    `);
    console.log('  ✓ Comentários adicionados');

    console.log('✅ Tabela cisp_statistic criada com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Removendo tabela cisp_statistic...');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_cisp_statistic_pontuacao;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cisp_statistic;`);

    console.log('✅ Tabela cisp_statistic removida');
  }
}
