import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LibraryModule } from './library/library.module';
import { UserModule } from './user/user.module';
import { RepositoryProviderModule } from './repository-provider/repository-provider.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule.forRoot(),
    RepositoryProviderModule,
    LibraryModule,
    UserModule,
  ],
})
export class AppModule {}
