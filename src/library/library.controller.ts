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
  DefaultValuePipe,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateLoanDto } from './loan/dto/create-loan.dto';
import { CreateReviewDto } from './review/dto/create-review.dto';

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
  getUserLoans(@Param('userId', ParseIntPipe) userId: number) {
    return this.libraryService.getUserLoans(userId);
  }

  @Get('users/:userId/reviews')
  getUserReviews(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.libraryService.getUserReviews(userId, limit, offset);
  }

  @Get('books/:bookId/loans')
  getBookLoans(@Param('bookId', ParseIntPipe) bookId: number) {
    return this.libraryService.getBookLoans(bookId);
  }

  @Get('books/:bookId/reviews')
  getBookReviews(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.libraryService.getBookReviews(bookId, limit, offset);
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  createReview(@Body() createReviewDto: CreateReviewDto) {
    return this.libraryService.createReview(createReviewDto);
  }
}
