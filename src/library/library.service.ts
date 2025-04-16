import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { BookService } from './book/book.service';
import { LoanService } from './loan/loan.service';
import { ReviewService } from './review/review.service';
import { CreateLoanDto } from './loan/dto/create-loan.dto';
import { CreateReviewDto } from './review/dto/create-review.dto';
import { BookStatus } from './book/book.entity';
import { LoanStatus } from './loan/loan.entity';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
    private readonly reviewService: ReviewService,
  ) {}

  private async ensureUserExists(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return user;
  }

  async createBooking(createLoanDto: CreateLoanDto) {
    const { userId, bookId } = createLoanDto;

    await this.ensureUserExists(userId);
    const book = await this.bookService.findOne(bookId);

    if (book.status !== BookStatus.AVAILABLE) {
      throw new Error(
        `Book with ID "${bookId}" is currently ${book.status} and cannot be booked.`,
      );
    }

    const loan = await this.loanService.createBooking(createLoanDto);

    await this.bookService.updateStatus(bookId, BookStatus.BOOKED);

    return loan;
  }

  async pickupLoan(loanId: number) {
    const loan = await this.loanService.findLoanWithDetails(loanId);

    if (loan.status !== LoanStatus.BOOKED) {
      throw new Error(
        `Loan with ID "${loanId}" has invalid status for pickup.`,
      );
    }

    const updatedLoan = await this.loanService.pickupLoan(loanId);
    await this.bookService.updateStatus(loan.bookId, BookStatus.BORROWED);

    return updatedLoan;
  }

  async returnLoan(loanId: number) {
    const loan = await this.loanService.findLoanWithDetails(loanId);

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new Error(
        `Loan with ID "${loanId}" has invalid status for return.`,
      );
    }

    const updatedLoan = await this.loanService.returnLoan(loanId);
    await this.bookService.updateStatus(loan.bookId, BookStatus.AVAILABLE);

    return updatedLoan;
  }

  async getUserLoans(userId: number) {
    await this.ensureUserExists(userId);
    return this.loanService.findUserLoans(userId);
  }

  async getUserReviews(userId: number, limit = 10, offset = 0) {
    await this.ensureUserExists(userId);
    return this.reviewService.findUserReviews(userId, limit, offset);
  }

  async getBookLoans(bookId: number) {
    await this.bookService.findOne(bookId);
    return this.loanService.findBookLoans(bookId);
  }

  async getBookReviews(bookId: number, limit = 10, offset = 0) {
    await this.bookService.findOne(bookId);
    return this.reviewService.findBookReviews(bookId, limit, offset);
  }

  async createReview(createReviewDto: CreateReviewDto) {
    const { userId, bookId, loanId } = createReviewDto;

    await this.ensureUserExists(userId);
    await this.bookService.findOne(bookId);

    if (loanId) {
      const loan = await this.loanService.findOne(loanId);
      if (loan.userId !== userId || loan.bookId !== bookId) {
        throw new Error(
          `Loan with ID "${loanId}" does not match the provided user and book.`,
        );
      }
    }

    return this.reviewService.create(createReviewDto);
  }
}
