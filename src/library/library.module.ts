import { Module } from '@nestjs/common';
import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { ReviewModule } from './review/review.module';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BookModule,
    LoanModule,
    ReviewModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [BookModule, LoanModule, ReviewModule],
})
export class LibraryModule {}
