import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { TypeOrmModule } from './typeorm/typeorm.module';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule,
        {
          module: class DynamicOrmModule {},
          imports: [
            {
              module: class DynamicOrmProvider {},
              imports: [DrizzleModule, TypeOrmModule],
              providers: [
                {
                  provide: 'DATABASE_ORM',
                  inject: [ConfigService],
                  useFactory: (configService: ConfigService) => {
                    const ormType = configService.get<string>('DB_ORM_TYPE');
                    console.log(`Using ORM type: ${ormType}`);
                    return ormType;
                  },
                },
              ],
              exports: ['DATABASE_ORM'],
            },
          ],
          global: true,
        },
      ],
      global: true,
    };
  }
}
