import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLoanDto } from './loan/dto/create-loan.dto';
import { CreateReviewDto } from './review/dto/create-review.dto';
import { FindLoansQueryDto } from './loan/dto/find-loans-query.dto';
import { FindReviewsQueryDto } from './review/dto/find-reviews-query.dto';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() createLoanDto: CreateLoanDto) {
    return this.libraryService.createBooking(createLoanDto);
  }

  @Patch('loans/:id/pickup')
  pickupLoan(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.pickupLoan(id);
  }

  @Patch('loans/:id/return')
  returnLoan(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.returnLoan(id);
  }

  @Get('users/:userId/loans')
  getUserLoans(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindLoansQueryDto,
  ) {
    const { userId: _, ...restQuery } = query;
    return this.libraryService.getUserLoans(userId, restQuery);
  }

  @Get('users/:userId/reviews')
  getUserReviews(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindReviewsQueryDto,
  ) {
    const { userId: _, ...restQuery } = query;
    return this.libraryService.getUserReviews(userId, restQuery);
  }

  @Get('books/:bookId/loans')
  getBookLoans(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() query: FindLoansQueryDto,
  ) {
    const { bookId: _, ...restQuery } = query;
    return this.libraryService.getBookLoans(bookId, restQuery);
  }

  @Get('books/:bookId/reviews')
  getBookReviews(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() query: FindReviewsQueryDto,
  ) {
    const { bookId: _, ...restQuery } = query;
    return this.libraryService.getBookReviews(bookId, restQuery);
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(@Body() createReviewDto: CreateReviewDto) {
    return this.libraryService.createReview(createReviewDto);
  }
}
