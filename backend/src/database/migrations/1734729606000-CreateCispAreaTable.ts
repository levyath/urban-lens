import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCispAreaTable1734729606000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🏗️  Criando tabela cisp_area...');

    // Criar tabela de áreas geográficas das delegacias CISP
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cisp_area (
        cisp_id INT PRIMARY KEY,
        nome VARCHAR(255),
        geom GEOMETRY(MULTIPOLYGON, 4326)
      );
    `);
    console.log('  ✓ Tabela cisp_area criada');

    // Índice espacial principal
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cisp_area_geom
        ON cisp_area USING GIST (geom);
    `);
    console.log('  ✓ idx_cisp_area_geom');

    // Índice espacial com geography (para ST_DWithin)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cisp_area_geog
        ON cisp_area USING GIST ((geom::geography));
    `);
    console.log('  ✓ idx_cisp_area_geog');

    // Índice para busca por nome
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cisp_area_nome
        ON cisp_area (nome)
        WHERE nome IS NOT NULL;
    `);
    console.log('  ✓ idx_cisp_area_nome');

    // Comentários nas colunas para documentação
    await queryRunner.query(`
      COMMENT ON TABLE cisp_area IS 'Áreas geográficas de cobertura das delegacias CISP';
      COMMENT ON COLUMN cisp_area.cisp_id IS 'Número identificador da delegacia CISP';
      COMMENT ON COLUMN cisp_area.nome IS 'Nome da delegacia CISP';
      COMMENT ON COLUMN cisp_area.geom IS 'Geometria da área de cobertura (MultiPolygon, SRID 4326)';
    `);
    console.log('  ✓ Comentários adicionados');

    // Atualizar estatísticas
    await queryRunner.query(`ANALYZE cisp_area;`);
    console.log('  ✓ Estatísticas atualizadas');

    console.log('✅ Tabela cisp_area criada com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Removendo tabela cisp_area...');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_cisp_area_nome;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cisp_area_geog;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cisp_area_geom;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cisp_area;`);

    console.log('✅ Tabela cisp_area removida');
  }
}
