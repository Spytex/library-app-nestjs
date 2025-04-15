import { forwardRef, Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { UserModule } from 'src/library/user/user.module';
import { BookModule } from 'src/library/book/book.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan]),
    forwardRef(() => UserModule),
    forwardRef(() => BookModule),
  ],
  providers: [LoanService],
  controllers: [LoanController],
  exports: [LoanService],
})
export class LoanModule {}
