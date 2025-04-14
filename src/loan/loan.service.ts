import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UserService } from '../user/user.service';
import { BookService } from '../book/book.service';
import { BookStatus } from '../book/book.entity';

@Injectable()
export class LoanService {
  private readonly LOAN_DURATION_DAYS = 14;
  private readonly EXTENSION_DAYS = 7;

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,

    // Use forwardRef if circular dependencies arise
    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    @Inject(forwardRef(() => BookService))
    private bookService: BookService,
  ) {}

  async createBooking(createLoanDto: CreateLoanDto): Promise<Loan> {
    const { userId, bookId } = createLoanDto;

    await this.userService.findOne(userId);
    const book = await this.bookService.findOne(bookId);

    if (book.status !== BookStatus.AVAILABLE) {
      throw new ConflictException(
        `Book with ID "${bookId}" is currently ${book.status} and cannot be booked.`,
      );
    }

    const newLoan = this.loanRepository.create({
      userId,
      bookId,
      status: LoanStatus.BOOKED,
      bookingDate: new Date(),
    });
    const savedLoan = await this.loanRepository.save(newLoan);

    try {
      await this.bookService.updateStatus(bookId, BookStatus.BOOKED);
    } catch (error) {
      await this.loanRepository.delete(savedLoan.id);
      throw error;
    }

    return savedLoan;
  }

  async pickupLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOneWithDetails(loanId);

    if (loan.status !== LoanStatus.BOOKED) {
      throw new ConflictException(
        `Loan with ID "${loanId}" has status ${loan.status}. Expected status: ${LoanStatus.BOOKED}.`,
      );
    }

    if (loan.book.status !== BookStatus.BOOKED) {
      console.warn(
        `Inconsistency: Loan ${loanId} is BOOKED, but Book ${loan.bookId} status is ${loan.book.status}. Attempting to fix.`,
      );
    }

    loan.status = LoanStatus.ACTIVE;
    loan.loanDate = new Date();
    loan.dueDate = this.calculateDueDate(loan.loanDate);

    const updatedLoan = await this.loanRepository.save(loan);

    try {
      await this.bookService.updateStatus(loan.bookId, BookStatus.BORROWED);
    } catch (error) {
      loan.status = LoanStatus.BOOKED;
      loan.loanDate = null;
      loan.dueDate = null;
      await this.loanRepository.save(loan);
      throw error;
    }

    return updatedLoan;
  }

  async returnLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOneWithDetails(loanId);

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new ConflictException(
        `Loan with ID "${loanId}" has status ${loan.status}. Expected status: ${LoanStatus.ACTIVE} or ${LoanStatus.OVERDUE}.`,
      );
    }

    if (loan.book.status !== BookStatus.BORROWED) {
      console.warn(
        `Inconsistency: Loan ${loanId} is ${loan.status}, but Book ${loan.bookId} status is ${loan.book.status}. Attempting to fix.`,
      );
    }

    loan.status = LoanStatus.RETURNED;
    loan.returnDate = new Date();

    const updatedLoan = await this.loanRepository.save(loan);

    try {
      await this.bookService.updateStatus(loan.bookId, BookStatus.AVAILABLE);
    } catch (error) {
      loan.status =
        loan.dueDate && loan.dueDate < new Date()
          ? LoanStatus.OVERDUE
          : LoanStatus.ACTIVE;
      loan.returnDate = null;
      await this.loanRepository.save(loan);
      throw error;
    }

    return updatedLoan;
  }

  async extendLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOne(loanId);

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ConflictException(
        `Loan with ID "${loanId}" has status ${loan.status}. Expected status: ${LoanStatus.ACTIVE}.`,
      );
    }

    if (!loan.dueDate) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has no due date set.`,
      );
    }

    loan.dueDate = this.addDays(loan.dueDate, this.EXTENSION_DAYS);

    return this.loanRepository.save(loan);
  }

  async findOne(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOneBy({ id });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  private async findOneWithDetails(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: ['book'],
    });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async findUserLoans(userId: number): Promise<Loan[]> {
    await this.userService.findOne(userId);
    return this.loanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
  }

  async findBookLoans(bookId: number): Promise<Loan[]> {
    await this.bookService.findOne(bookId);
    return this.loanRepository.find({
      where: { bookId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  private calculateDueDate(startDate: Date): Date {
    return this.addDays(startDate, this.LOAN_DURATION_DAYS);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
