import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as schema from '../db/schema';
import { bookStatusEnum, loanStatusEnum } from '../db/schema';
import { UserService } from '../user/user.service';
import { BookService } from './book/book.service';
import { LoanService } from './loan/loan.service';
import { ReviewService } from './review/review.service';
import { CreateLoanDto } from './loan/dto/create-loan.dto';
import { CreateReviewDto } from './review/dto/create-review.dto';

type UserSelect = typeof schema.users.$inferSelect;
type LoanSelect = typeof schema.loans.$inferSelect;
type ReviewSelect = typeof schema.reviews.$inferSelect;

@Injectable()
export class LibraryService {
  constructor(
    private readonly userService: UserService,
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
    private readonly reviewService: ReviewService,
  ) {}

  private async ensureUserExists(userId: number): Promise<UserSelect> {
    try {
      const user = await this.userService.findOne(userId);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }
      throw error;
    }
  }

  async createBooking(createLoanDto: CreateLoanDto): Promise<LoanSelect> {
    const { userId, bookId } = createLoanDto;

    await this.ensureUserExists(userId);
    const book = await this.bookService.findOne(bookId);

    if (book.status !== bookStatusEnum.enumValues[0]) {
      // AVAILABLE
      throw new BadRequestException(
        `Book with ID "${bookId}" is currently ${book.status} and cannot be booked.`,
      );
    }

    const loan = await this.loanService.createBooking(createLoanDto);

    try {
      await this.bookService.updateStatus(bookId, bookStatusEnum.enumValues[1]); // BOOKED
    } catch (error) {
      console.error('Failed to update book status after creating loan', error);
      throw error;
    }

    return loan;
  }

  async pickupLoan(loanId: number): Promise<LoanSelect> {
    const loan = await this.loanService.findOneWithRelations(loanId);

    if (loan.status !== loanStatusEnum.enumValues[0]) {
      // BOOKED
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${loan.status}, cannot be picked up.`,
      );
    }

    const updatedLoan = await this.loanService.pickupLoan(loanId);

    try {
      await this.bookService.updateStatus(
        loan.bookId,
        bookStatusEnum.enumValues[2],
      ); // BORROWED
    } catch (error) {
      console.error(
        'Failed to update book status after picking up loan',
        error,
      );
      throw error;
    }

    return updatedLoan;
  }

  async returnLoan(loanId: number): Promise<LoanSelect> {
    const loan = await this.loanService.findOneWithRelations(loanId);

    if (
      loan.status !== loanStatusEnum.enumValues[1] && // ACTIVE
      loan.status !== loanStatusEnum.enumValues[3] // OVERDUE
    ) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${loan.status}, cannot be returned.`,
      );
    }

    const updatedLoan = await this.loanService.returnLoan(loanId);

    try {
      await this.bookService.updateStatus(
        loan.bookId,
        bookStatusEnum.enumValues[0],
      ); // AVAILABLE
    } catch (error) {
      console.error('Failed to update book status after returning loan', error);
      throw error;
    }

    return updatedLoan;
  }

  async getUserLoans(userId: number): Promise<any[]> {
    await this.ensureUserExists(userId);
    return this.loanService.findUserLoans(userId);
  }

  async getUserReviews(userId: number, limit = 10, offset = 0): Promise<any[]> {
    await this.ensureUserExists(userId);
    return this.reviewService.findUserReviews(userId, limit, offset);
  }

  async getBookLoans(bookId: number): Promise<any[]> {
    await this.bookService.findOne(bookId);
    return this.loanService.findBookLoans(bookId);
  }

  async getBookReviews(bookId: number, limit = 10, offset = 0): Promise<any[]> {
    await this.bookService.findOne(bookId);
    return this.reviewService.findBookReviews(bookId, limit, offset);
  }

  async createReview(createReviewDto: CreateReviewDto): Promise<ReviewSelect> {
    const { userId, bookId, loanId } = createReviewDto;

    await this.ensureUserExists(userId);
    await this.bookService.findOne(bookId);

    if (loanId) {
      try {
        const loan = await this.loanService.findOne(loanId);
        if (loan.userId !== userId || loan.bookId !== bookId) {
          throw new BadRequestException(
            `Loan with ID "${loanId}" does not match the provided user (ID: ${userId}) and book (ID: ${bookId}).`,
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(`Loan with ID "${loanId}" not found.`);
        }
        throw error;
      }
    }

    return this.reviewService.create(createReviewDto);
  }
}
