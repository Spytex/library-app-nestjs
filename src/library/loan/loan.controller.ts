import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { FindLoansQueryDto } from './dto/find-loans-query.dto';

@Controller()
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() createLoanDto: CreateLoanDto) {
    return this.loanService.createBooking(createLoanDto);
  }

  @Get('loans')
  findAll(@Query() query: FindLoansQueryDto) {
    return this.loanService.findAll(query);
  }

  @Get('loans/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loanService.findOne(id);
  }

  @Patch('loans/:id/pickup')
  pickupLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loanService.pickupLoan(id);
  }

  @Patch('loans/:id/return')
  returnLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loanService.returnLoan(id);
  }

  @Patch('loans/:id/extend')
  extendLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loanService.extendLoan(id);
  }

  @Get('users/:userId/loans')
  findUserLoans(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: FindLoansQueryDto,
  ) {
    const { userId: _, ...restQuery } = query;
    return this.loanService.findUserLoans(userId, restQuery);
  }

  @Get('books/:bookId/loans')
  findBookLoans(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() query: FindLoansQueryDto,
  ) {
    const { bookId: _, ...restQuery } = query;
    return this.loanService.findBookLoans(bookId, restQuery);
  }
}
