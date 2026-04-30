import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostGISExtension1734729601000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar extensão PostGIS (se não existir)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    
    console.log('✅ Extensão PostGIS criada/verificada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Não remover extensão no rollback (pode afetar outras tabelas)
    console.log('⚠️  Extensão PostGIS mantida (não removida no rollback)');
  }
}
