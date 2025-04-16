import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoanService {
  private readonly LOAN_DURATION_DAYS = 14;
  private readonly EXTENSION_DAYS = 7;

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
  ) {}

  async createBooking(createLoanDto: CreateLoanDto): Promise<Loan> {
    const { userId, bookId } = createLoanDto;

    const newLoan = this.loanRepository.create({
      userId,
      bookId,
      status: LoanStatus.BOOKED,
      bookingDate: new Date(),
    });

    return this.loanRepository.save(newLoan);
  }

  async pickupLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOne(loanId);

    loan.status = LoanStatus.ACTIVE;
    loan.loanDate = new Date();
    loan.dueDate = this.calculateDueDate(loan.loanDate);

    return this.loanRepository.save(loan);
  }

  async returnLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOne(loanId);

    loan.status = LoanStatus.RETURNED;
    loan.returnDate = new Date();

    return this.loanRepository.save(loan);
  }

  async extendLoan(loanId: number): Promise<Loan> {
    const loan = await this.findOne(loanId);

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

  async findLoanWithDetails(id: number): Promise<Loan> {
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
    return this.loanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
  }

  async findBookLoans(bookId: number): Promise<Loan[]> {
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
