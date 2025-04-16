import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { ReviewModule } from './review/review.module';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';

@Module({
  imports: [UserModule, BookModule, LoanModule, ReviewModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [UserModule, BookModule, LoanModule, ReviewModule],
})
export class LibraryModule {}
