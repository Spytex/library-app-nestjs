import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book } from './book.entity';
import { BOOK_REPOSITORY } from './repositories/book.repository.interface';
import { TypeOrmBookRepository } from './repositories/typeorm/book.repository';
import { DrizzleBookRepository } from './repositories/drizzle/book.repository';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../db/drizzle.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Book])],
  providers: [
    BookService,
    {
      provide: BOOK_REPOSITORY,
      inject: [ConfigService, getRepositoryToken(Book), DRIZZLE_CLIENT],
      useFactory: (
        configService: ConfigService,
        typeOrmBookRepo: Repository<Book>,
        drizzleDb: DrizzleDB,
      ) => {
        const ormType = configService.get<string>('DB_ORM_TYPE');
        if (ormType === 'drizzle') {
          console.log('Using DrizzleBookRepository');
          return new DrizzleBookRepository(drizzleDb);
        } else {
          console.log('Using TypeOrmBookRepository');
          return new TypeOrmBookRepository(typeOrmBookRepo);
        }
      },
    },
  ],
  controllers: [BookController],
  exports: [BookService, BOOK_REPOSITORY],
})
export class BookModule {}
