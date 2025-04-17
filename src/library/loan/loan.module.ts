import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { Loan } from './loan.entity';
import { LOAN_REPOSITORY } from './repositories/loan.repository.interface';
import { TypeOrmLoanRepository } from './repositories/typeorm/loan.repository';
import { DrizzleLoanRepository } from './repositories/drizzle/loan.repository';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../db/drizzle.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Loan])],
  providers: [
    LoanService,
    {
      provide: LOAN_REPOSITORY,
      inject: [ConfigService, getRepositoryToken(Loan), DRIZZLE_CLIENT],
      useFactory: (
        configService: ConfigService,
        typeOrmLoanRepo: Repository<Loan>,
        drizzleDb: DrizzleDB,
      ) => {
        const ormType = configService.get<string>('DB_ORM_TYPE');
        if (ormType === 'drizzle') {
          console.log('Using DrizzleLoanRepository');
          return new DrizzleLoanRepository(drizzleDb);
        } else {
          console.log('Using TypeOrmLoanRepository');
          return new TypeOrmLoanRepository(typeOrmLoanRepo);
        }
      },
    },
  ],
  controllers: [LoanController],
  exports: [LoanService, LOAN_REPOSITORY],
})
export class LoanModule {}
