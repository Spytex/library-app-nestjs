import { CreateLoanDto } from '../dto/create-loan.dto';
import { Loan, LoanStatus } from '../loan.entity';
import { LoanSelect } from '../../../db/schema';

export type LoanRepresentation = Loan | LoanSelect;

export interface ILoanRepository {
  create(
    createLoanDto: CreateLoanDto,
    status: LoanStatus,
    bookingDate?: Date,
    loanDate?: Date,
    dueDate?: Date,
  ): Promise<LoanRepresentation>;
  findById(id: number): Promise<LoanRepresentation | null>;
  findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanRepresentation | null>;
  findUserLoans(userId: number): Promise<LoanRepresentation[]>;
  findBookLoans(bookId: number): Promise<LoanRepresentation[]>;
  update(
    id: number,
    data: Partial<LoanRepresentation>,
  ): Promise<LoanRepresentation | null>;
  remove(id: number): Promise<boolean>;
  count(criteria?: any): Promise<number>;
}

export const LOAN_REPOSITORY = 'ILoanRepository';
