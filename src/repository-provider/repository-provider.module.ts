import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../user/user.entity';
import { Book } from '../library/book/book.entity';
import { Loan } from '../library/loan/loan.entity';
import { Review } from '../library/review/review.entity';

import { USER_REPOSITORY } from '../user/repositories/user.repository.interface';
import { BOOK_REPOSITORY } from '../library/book/repositories/book.repository.interface';
import { LOAN_REPOSITORY } from '../library/loan/repositories/loan.repository.interface';
import { REVIEW_REPOSITORY } from '../library/review/repositories/review.repository.interface';

import { TypeOrmUserRepository } from '../user/repositories/typeorm/user.repository';
import { TypeOrmBookRepository } from '../library/book/repositories/typeorm/book.repository';
import { TypeOrmLoanRepository } from '../library/loan/repositories/typeorm/loan.repository';
import { TypeOrmReviewRepository } from '../library/review/repositories/typeorm/review.repository';

import { DrizzleUserRepository } from '../user/repositories/drizzle/user.repository';
import { DrizzleBookRepository } from '../library/book/repositories/drizzle/book.repository';
import { DrizzleLoanRepository } from '../library/loan/repositories/drizzle/loan.repository';
import { DrizzleReviewRepository } from '../library/review/repositories/drizzle/review.repository';

import { DRIZZLE_CLIENT, DrizzleDB } from '../db/drizzle.module';

const createRepositoryProvider = (
  provide: string | symbol,
  entity: Function,
  typeOrmRepoClass: any,
  drizzleRepoClass: any,
) => ({
  provide,
  inject: [ConfigService, getRepositoryToken(entity), DRIZZLE_CLIENT],
  useFactory: (
    configService: ConfigService,
    typeOrmRepo: Repository<any>,
    drizzleDb: DrizzleDB,
  ) => {
    const ormType = configService.get<string>('DB_ORM_TYPE');
    if (ormType === 'drizzle') {
      console.log(`Using Drizzle for ${entity.name}`);
      return new drizzleRepoClass(drizzleDb);
    } else {
      console.log(`Using TypeORM for ${entity.name}`);
      return new typeOrmRepoClass(typeOrmRepo);
    }
  },
});

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Book, Loan, Review])],
  providers: [
    createRepositoryProvider(
      USER_REPOSITORY,
      User,
      TypeOrmUserRepository,
      DrizzleUserRepository,
    ),
    createRepositoryProvider(
      BOOK_REPOSITORY,
      Book,
      TypeOrmBookRepository,
      DrizzleBookRepository,
    ),
    createRepositoryProvider(
      LOAN_REPOSITORY,
      Loan,
      TypeOrmLoanRepository,
      DrizzleLoanRepository,
    ),
    createRepositoryProvider(
      REVIEW_REPOSITORY,
      Review,
      TypeOrmReviewRepository,
      DrizzleReviewRepository,
    ),
  ],
  exports: [
    USER_REPOSITORY,
    BOOK_REPOSITORY,
    LOAN_REPOSITORY,
    REVIEW_REPOSITORY,
  ],
})
export class RepositoryProviderModule {}
