import { forwardRef, Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UserModule } from 'src/library/user/user.module';
import { BookModule } from 'src/library/book/book.module';
import { LoanModule } from 'src/library/loan/loan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => UserModule),
    forwardRef(() => BookModule),
    forwardRef(() => LoanModule),
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
