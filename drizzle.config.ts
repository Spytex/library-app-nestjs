import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;
if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE) {
  throw new Error('Database environment variables are not set.');
}
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
