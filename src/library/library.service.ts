import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { BookService } from './book/book.service';
import { LoanService } from './loan/loan.service';
import { ReviewService } from './review/review.service';
import { CreateLoanDto } from './loan/dto/create-loan.dto';
import { CreateReviewDto } from './review/dto/create-review.dto';
import { BookStatus } from './book/book.entity';
import { LoanStatus } from './loan/loan.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../user/repositories/user.repository.interface';
import { UserDto } from '../user/dto/user.dto';
import { LoanDto } from './loan/dto/loan.dto';
import { ReviewDto } from './review/dto/review.dto';
import { FindLoansQueryDto } from './loan/dto/find-loans-query.dto';
import { FindReviewsQueryDto } from './review/dto/find-reviews-query.dto';
import { IPaginatedResult } from '../common/utils/pagination.utils';
import { UserService } from '../user/user.service';

@Injectable()
export class LibraryService {
  constructor(
    private readonly userService: UserService,
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
    private readonly reviewService: ReviewService,
  ) {}

  private async ensureUserExists(userId: number): Promise<UserDto> {
    return this.userService.findOne(userId);
  }

  async createBooking(createLoanDto: CreateLoanDto): Promise<LoanDto> {
    const { userId, bookId } = createLoanDto;

    await this.ensureUserExists(userId);
    const book = await this.bookService.findOne(bookId);

    if (book.status !== BookStatus.AVAILABLE) {
      throw new ConflictException(
        `Book with ID "${bookId}" is currently ${book.status} and cannot be booked.`,
      );
    }

    const loan = await this.loanService.createBooking(createLoanDto);
    await this.bookService.updateStatus(bookId, BookStatus.BOOKED);

    return loan;
  }

  async pickupLoan(loanId: number): Promise<LoanDto> {
    const loan = await this.loanService.findOne(loanId);

    if (loan.status !== LoanStatus.BOOKED) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${loan.status}, cannot be picked up.`,
      );
    }

    const updatedLoan = await this.loanService.pickupLoan(loanId);
    await this.bookService.updateStatus(loan.bookId, BookStatus.BORROWED);

    return updatedLoan;
  }

  async returnLoan(loanId: number): Promise<LoanDto> {
    const loan = await this.loanService.findOne(loanId);

    const isOverdue = loan.dueDate && new Date() > loan.dueDate;
    const currentStatus = isOverdue ? LoanStatus.OVERDUE : loan.status;

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${loan.status}, cannot be returned.`,
      );
    }

    const updatedLoan = await this.loanService.returnLoan(loanId);
    await this.bookService.updateStatus(loan.bookId, BookStatus.AVAILABLE);

    if (isOverdue && updatedLoan.status === LoanStatus.RETURNED) {
      console.warn(`Loan ${loanId} returned overdue.`);
    }

    return updatedLoan;
  }

  async getUserLoans(
    userId: number,
    query: FindLoansQueryDto,
  ): Promise<IPaginatedResult<LoanDto>> {
    await this.ensureUserExists(userId);
    return this.loanService.findUserLoans(userId, query);
  }

  async getUserReviews(
    userId: number,
    query: FindReviewsQueryDto,
  ): Promise<IPaginatedResult<ReviewDto>> {
    await this.ensureUserExists(userId);
    return this.reviewService.findUserReviews(userId, query);
  }

  async getBookLoans(
    bookId: number,
    query: FindLoansQueryDto,
  ): Promise<IPaginatedResult<LoanDto>> {
    await this.bookService.findOne(bookId);
    return this.loanService.findBookLoans(bookId, query);
  }

  async getBookReviews(
    bookId: number,
    query: FindReviewsQueryDto,
  ): Promise<IPaginatedResult<ReviewDto>> {
    await this.bookService.findOne(bookId);
    return this.reviewService.findBookReviews(bookId, query);
  }

  async createReview(createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const { userId, bookId, loanId } = createReviewDto;

    await this.ensureUserExists(userId);
    await this.bookService.findOne(bookId);

    if (loanId) {
      const loan = await this.loanService.findOne(loanId);
      if (loan.userId !== userId || loan.bookId !== bookId) {
        throw new BadRequestException(
          `Loan with ID "${loanId}" does not match the provided user "${userId}" and book "${bookId}".`,
        );
      }
      if (loan.status !== LoanStatus.RETURNED) {
        throw new BadRequestException(
          `Cannot review book for loan ID "${loanId}" as it is not yet returned (status: ${loan.status}).`,
        );
      }
    } else {
      const userLoansForBook = await this.loanService.findAll({
        userId,
        bookId,
        status: LoanStatus.RETURNED,
        limit: 1,
      });
      if (userLoansForBook.meta.pagination.totalItems === 0) {
        throw new BadRequestException(
          `User "${userId}" has not previously borrowed book "${bookId}" and cannot review it without a specific loan ID.`,
        );
      }
    }

    return this.reviewService.create(createReviewDto);
  }
}
