import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { USER_REPOSITORY } from './repositories/user.repository.interface';
import { TypeOrmUserRepository } from './repositories/typeorm/user.repository';
import { DrizzleUserRepository } from './repositories/drizzle/user.repository';
import { DRIZZLE_CLIENT, DrizzleDB } from '../db/drizzle.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      inject: [ConfigService, getRepositoryToken(User), DRIZZLE_CLIENT],
      useFactory: (
        configService: ConfigService,
        typeOrmUserRepo: Repository<User>,
        drizzleDb: DrizzleDB,
      ) => {
        const ormType = configService.get<string>('DB_ORM_TYPE');
        if (ormType === 'drizzle') {
          console.log('Using DrizzleUserRepository');
          return new DrizzleUserRepository(drizzleDb);
        } else {
          console.log('Using TypeOrmUserRepository');
          return new TypeOrmUserRepository(typeOrmUserRepo);
        }
      },
    },
  ],
  controllers: [UserController],
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
