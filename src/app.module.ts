import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { DrizzleModule } from './db/drizzle.module';
import { LibraryModule } from './library/library.module';
import { UserModule } from './user/user.module';
import { RepositoryProviderModule } from './repository-provider/repository-provider.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    DrizzleModule,
    RepositoryProviderModule,
    LibraryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
