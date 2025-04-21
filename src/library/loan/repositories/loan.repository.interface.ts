import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { FindLoansQueryDto } from '../dto/find-loans-query.dto';
import { LoanStatus } from '../loan.entity';
import { LoanDto } from '../dto/loan.dto';

export type ILoanFilterCriteria = Omit<
  FindLoansQueryDto,
  keyof PaginationQueryDto
>;

export interface ILoanRepository {
  create(
    createLoanDto: CreateLoanDto,
    status: LoanStatus,
    bookingDate?: Date,
    loanDate?: Date,
    dueDate?: Date,
  ): Promise<LoanDto>;
  findAll(query: FindLoansQueryDto): Promise<LoanDto[]>;
  findById(id: number): Promise<LoanDto | null>;
  findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanDto | null>;
  update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null>;
  remove(id: number): Promise<boolean>;
  count(criteria?: ILoanFilterCriteria): Promise<number>;
}

export const LOAN_REPOSITORY = 'ILoanRepository';
