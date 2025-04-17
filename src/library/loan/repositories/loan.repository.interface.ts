import { CreateLoanDto } from '../dto/create-loan.dto';
import { LoanStatus } from '../loan.entity';
import { LoanDto } from '../dto/loan.dto';

export interface ILoanCountCriteria {
  userId?: number;
  bookId?: number;
  status?: LoanStatus;
  isOverdue?: boolean;
}

export interface ILoanRepository {
  create(
    createLoanDto: CreateLoanDto,
    status: LoanStatus,
    bookingDate?: Date,
    loanDate?: Date,
    dueDate?: Date,
  ): Promise<LoanDto>;
  findById(id: number): Promise<LoanDto | null>;
  findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanDto | null>;
  findUserLoans(userId: number): Promise<LoanDto[]>;
  findBookLoans(bookId: number): Promise<LoanDto[]>;
  update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null>;
  remove(id: number): Promise<boolean>;
  count(criteria?: ILoanCountCriteria): Promise<number>;
}

export const LOAN_REPOSITORY = 'ILoanRepository';
