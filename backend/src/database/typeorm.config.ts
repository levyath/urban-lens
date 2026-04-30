import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST_DB || 'localhost',
  port: parseInt(process.env.DB_PORT_DB || '5432'),
  username: process.env.DB_USER || 'osm',
  password: process.env.DB_PASSWORD || 'osm',
  database: process.env.DB_DATABASE_DB || 'osm',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
