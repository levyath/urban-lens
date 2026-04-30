import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOSMIndexes1700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔍 Verificando se tabela planet_osm_point existe...');

    // Verificar se a tabela existe (criada pelo osm2pgsql)
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'planet_osm_point'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela planet_osm_point não existe ainda.');
      console.log(
        '   Execute o import OSM primeiro: infra/scripts/import-local.ps1',
      );
      return;
    }

    console.log('✅ Tabela planet_osm_point encontrada');
    console.log('📊 Criando índices espaciais e de performance...');

    // Índice espacial base (GIST)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_planet_osm_point_way
        ON planet_osm_point USING GIST (way);
    `);
    console.log('  ✓ idx_planet_osm_point_way');

    // Índice espacial com geography (para ST_DWithin)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_planet_osm_point_geog
        ON planet_osm_point USING GIST ((ST_Transform(way, 4326)::geography));
    `);
    console.log('  ✓ idx_planet_osm_point_geog');

    // Índice para filtro de amenity (restaurantes, farmácias, etc)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_planet_osm_point_amenity
        ON planet_osm_point (amenity)
        WHERE amenity IS NOT NULL;
    `);
    console.log('  ✓ idx_planet_osm_point_amenity');

    // Índice para filtro de highway (paradas de ônibus, etc)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_planet_osm_point_highway
        ON planet_osm_point (highway)
        WHERE highway IS NOT NULL;
    `);
    console.log('  ✓ idx_planet_osm_point_highway');

    // Índice para filtro de railway (estações de trem/metrô)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_planet_osm_point_railway
        ON planet_osm_point (railway)
        WHERE railway IS NOT NULL;
    `);
    console.log('  ✓ idx_planet_osm_point_railway');

    // Atualizar estatísticas para o query planner
    await queryRunner.query(`ANALYZE planet_osm_point;`);
    console.log('  ✓ Estatísticas atualizadas');

    console.log('✅ Índices OSM criados com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Removendo índices OSM...');

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_planet_osm_point_railway;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_planet_osm_point_highway;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_planet_osm_point_amenity;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_planet_osm_point_geog;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_planet_osm_point_way;`);

    console.log('✅ Índices OSM removidos');
  }
}
