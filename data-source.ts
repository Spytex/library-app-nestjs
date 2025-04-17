import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/typeorm/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
