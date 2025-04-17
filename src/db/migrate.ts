import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE) {
  throw new Error('Database environment variables are not set for migration.');
}

const runMigrate = async () => {
  const connectionString = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
  const migrationClient = postgres(connectionString, { max: 1 });

  console.log('Running Drizzle migrations...');

  try {
    await migrate(drizzle(migrationClient), {
      migrationsFolder: './drizzle/migrations',
    });
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
};

runMigrate();
