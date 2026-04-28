import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class ImportCispAreaData1734729608000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📥 Importando áreas geográficas das delegacias CISP...');

    // Caminho para o arquivo GeoJSON
    const geoJsonPath = path.join(__dirname, '../../../src/data/cisp-mapa.json');

    // Verificar se o arquivo existe
    if (!fs.existsSync(geoJsonPath)) {
      console.log('⚠️  Arquivo GeoJSON não encontrado:', geoJsonPath);
      console.log('   Pulando importação de dados.');
      return;
    }

    console.log('  ✓ Arquivo GeoJSON encontrado');

    // Ler e parsear o GeoJSON
    const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf-8');
    const geoJson = JSON.parse(geoJsonContent);

    if (!geoJson.features || geoJson.features.length === 0) {
      console.log('⚠️  Nenhuma feature encontrada no GeoJSON');
      return;
    }

    console.log(`  ✓ ${geoJson.features.length} features encontradas`);
    console.log('  ⏳ Inserindo dados (pode demorar alguns segundos)...');

    let inserted = 0;
    let errors = 0;

    // Inserir cada feature
    for (const feature of geoJson.features) {
      try {
        const props = feature.properties || {};
        const geometry = feature.geometry;

        if (!geometry) {
          errors++;
          continue;
        }

        const cispId = props.cisp || props.CISP || props.id;
        const nome = props.nome || props.NOME || props.name || `CISP ${cispId}`;

        if (!cispId) {
          errors++;
          continue;
        }

        // Converter geometria para WKT (Well-Known Text)
        const geomJson = JSON.stringify(geometry);

        await queryRunner.query(
          `
          INSERT INTO cisp_area (cisp_id, nome, geom)
          VALUES (
            $1,
            $2,
            ST_Multi(
              ST_CollectionExtract(
                ST_MakeValid(
                  ST_Transform(
                    ST_GeomFromGeoJSON($3),
                    4326
                  )
                ),
                3
              )
            )::geometry(MultiPolygon, 4326)
          )
          ON CONFLICT (cisp_id) DO UPDATE SET
            nome = EXCLUDED.nome,
            geom = EXCLUDED.geom
          `,
          [cispId, nome, geomJson]
        );

        inserted++;

        // Log de progresso a cada 10 registros
        if (inserted % 10 === 0) {
          console.log(`    → ${inserted} áreas inseridas...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`    ⚠️  Erro ao inserir feature:`, error.message);
        }
      }
    }

    // Atualizar estatísticas após inserção
    await queryRunner.query(`ANALYZE cisp_area;`);

    console.log(`✅ Importação concluída!`);
    console.log(`   • ${inserted} áreas inseridas`);
    if (errors > 0) {
      console.log(`   • ${errors} erros (geometrias inválidas ignoradas)`);
    }

    // Mostrar estatísticas
    const stats = await queryRunner.query(`
      SELECT 
        COUNT(*) as total,
        ST_SRID(geom) as srid
      FROM cisp_area
      GROUP BY ST_SRID(geom);
    `);

    if (stats.length > 0) {
      console.log(`   • Total: ${stats[0].total} áreas CISP`);
      console.log(`   • SRID: ${stats[0].srid}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Removendo áreas geográficas CISP...');

    await queryRunner.query(`TRUNCATE TABLE cisp_area;`);

    console.log('✅ Dados removidos');
  }
}
