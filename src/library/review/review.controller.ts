import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';

@Controller() // Base path can be defined in LibraryController or here if needed
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // This endpoint might be redundant if LibraryController handles review creation
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Get('reviews') // General endpoint to find all reviews with filters
  findAll(@Query() query: FindReviewsQueryDto) {
    return this.reviewService.findAll(query);
  }

  // Specific endpoints remain useful for clarity
  @Get('books/:bookId/reviews')
  findBookReviews(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() query: FindReviewsQueryDto,
  ) {
    // Remove bookId from query DTO if present to avoid conflict
    const { bookId: _, ...restQuery } = query;
    return this.reviewService.findBookReviews(bookId, restQuery);
  }

  @Get('users/:userId/reviews')
  findUserReviews(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindReviewsQueryDto,
  ) {
    // Remove userId from query DTO if present to avoid conflict
    const { userId: _, ...restQuery } = query;
    return this.reviewService.findUserReviews(userId, restQuery);
  }

  @Get('reviews/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findOne(id);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.remove(id);
  }
}
