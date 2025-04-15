import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { ReviewModule } from './review/review.module';


@Module({
  imports: [UserModule, BookModule, LoanModule, ReviewModule],
  exports: [UserModule, BookModule, LoanModule, ReviewModule],
})
export class LibraryModule {}
