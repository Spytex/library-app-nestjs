import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { LoanStatus } from './loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import {
  ILoanRepository,
  LOAN_REPOSITORY,
} from './repositories/loan.repository.interface';
import { LoanDto } from './dto/loan.dto';
import { FindLoansQueryDto } from './dto/find-loans-query.dto';
import {
  IPaginatedResult,
  createPaginatedResponse,
} from '../../common/utils/pagination.utils';

@Injectable()
export class LoanService {
  private readonly LOAN_DURATION_DAYS = 14;
  private readonly EXTENSION_DAYS = 7;

  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: ILoanRepository,
  ) {}

  async createBooking(createLoanDto: CreateLoanDto): Promise<LoanDto> {
    return this.loanRepository.create(
      createLoanDto,
      LoanStatus.BOOKED,
      new Date(),
    );
  }

  async pickupLoan(loanId: number): Promise<LoanDto> {
    await this.findOne(loanId);

    const updatedLoan = await this.loanRepository.update(loanId, {
      status: LoanStatus.ACTIVE,
      loanDate: new Date(),
      dueDate: this.calculateDueDate(new Date()),
    });

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during update.`,
      );
    }
    return updatedLoan;
  }

  async returnLoan(loanId: number): Promise<LoanDto> {
    await this.findOne(loanId);

    const updatedLoan = await this.loanRepository.update(loanId, {
      status: LoanStatus.RETURNED,
      returnDate: new Date(),
    });

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during update.`,
      );
    }
    return updatedLoan;
  }

  async extendLoan(loanId: number): Promise<LoanDto> {
    const loan = await this.findOne(loanId);

    if (!loan.dueDate) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has no due date set, cannot extend.`,
      );
    }
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has status ${loan.status}, cannot be extended.`,
      );
    }

    const updatedLoan = await this.loanRepository.update(loanId, {
      dueDate: this.addDays(loan.dueDate, this.EXTENSION_DAYS),
    });

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during update.`,
      );
    }
    return updatedLoan;
  }

  async findAll(query: FindLoansQueryDto): Promise<IPaginatedResult<LoanDto>> {
    const { page = 1, limit = 10, ...filters } = query;
    const items = await this.loanRepository.findAll(query);
    const totalItems = await this.loanRepository.count(filters);
    return createPaginatedResponse<LoanDto>(items, totalItems, page, limit);
  }

  async findOne(id: number): Promise<LoanDto> {
    const loan = await this.loanRepository.findByIdWithRelations(id, [
      'user',
      'book',
    ]);
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async findUserLoans(
    userId: number,
    query: FindLoansQueryDto,
  ): Promise<IPaginatedResult<LoanDto>> {
    query.userId = userId;
    return this.findAll(query);
  }

  async findBookLoans(
    bookId: number,
    query: FindLoansQueryDto,
  ): Promise<IPaginatedResult<LoanDto>> {
    query.bookId = bookId;
    return this.findAll(query);
  }

  async findLoanWithDetails(id: number): Promise<LoanDto> {
    return this.findOne(id);
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
