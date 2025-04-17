import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';
export type DrizzleDB = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<DrizzleDB> => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT');
        const user = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_DATABASE');
        const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;

        if (!host || !port || !user || !password || !database) {
          throw new Error(
            'Missing one or more database environment variables (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)',
          );
        }

        try {
          const client = postgres(connectionString, { max: 1 });
          const db = drizzle(client, { schema, logger: false });
          return db;
        } catch (error) {
          console.error('Failed to create Drizzle client:', error);
          throw error;
        }
      },
    },
  ],
  exports: [DRIZZLE_CLIENT],
})
export class DrizzleModule {}
