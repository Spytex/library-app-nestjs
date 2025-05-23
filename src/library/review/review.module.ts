import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
