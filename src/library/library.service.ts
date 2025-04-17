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

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
    private readonly reviewService: ReviewService,
  ) {}

  private async ensureUserExists(userId: number): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return user;
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
    const loan = await this.loanService.findLoanWithDetails(loanId);

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
    const loan = await this.loanService.findLoanWithDetails(loanId);

    const isOverdue = loan.dueDate && loan.dueDate < new Date();
    const currentStatus = isOverdue ? LoanStatus.OVERDUE : loan.status;

    if (
      currentStatus !== LoanStatus.ACTIVE &&
      currentStatus !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${currentStatus}, cannot be returned.`,
      );
    }

    const updatedLoan = await this.loanService.returnLoan(loanId);
    await this.bookService.updateStatus(loan.bookId, BookStatus.AVAILABLE);

    return updatedLoan;
  }

  async getUserLoans(userId: number): Promise<LoanDto[]> {
    await this.ensureUserExists(userId);
    return this.loanService.findUserLoans(userId);
  }

  async getUserReviews(
    userId: number,
    limit = 10,
    offset = 0,
  ): Promise<ReviewDto[]> {
    await this.ensureUserExists(userId);
    return this.reviewService.findUserReviews(userId, limit, offset);
  }

  async getBookLoans(bookId: number): Promise<LoanDto[]> {
    await this.bookService.findOne(bookId);
    return this.loanService.findBookLoans(bookId);
  }

  async getBookReviews(
    bookId: number,
    limit = 10,
    offset = 0,
  ): Promise<ReviewDto[]> {
    await this.bookService.findOne(bookId);
    return this.reviewService.findBookReviews(bookId, limit, offset);
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
    }

    return this.reviewService.create(createReviewDto);
  }
}
