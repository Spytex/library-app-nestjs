import { Loan, LoanStatus } from '../../library/loan/loan.entity';
import { LoanDto } from '../../library/loan/dto/loan.dto';
import { mapUserToDto, mapDrizzleUserToDto } from './user.mapper';
import { mapBookToDto, mapDrizzleBookToDto } from './book.mapper';
import {
  BookSelect,
  LoanSelect,
  UserSelect,
} from 'src/database/drizzle/schema';

export function mapLoanToDto(loan: Loan): LoanDto {
  return {
    id: loan.id,
    userId: loan.userId,
    bookId: loan.bookId,
    bookingDate: loan.bookingDate,
    loanDate: loan.loanDate,
    dueDate: loan.dueDate,
    returnDate: loan.returnDate,
    status: loan.status,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    user: loan.user ? mapUserToDto(loan.user) : undefined,
    book: loan.book ? mapBookToDto(loan.book) : undefined,
  };
}

export function mapDrizzleLoanToDto(
  loan: LoanSelect & { user?: UserSelect; book?: BookSelect },
): LoanDto {
  return {
    id: loan.id,
    userId: loan.userId,
    bookId: loan.bookId,
    bookingDate: loan.bookingDate ?? null,
    loanDate: loan.loanDate ?? null,
    dueDate: loan.dueDate ?? null,
    returnDate: loan.returnDate ?? null,
    status: loan.status as LoanStatus,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    user: loan.user ? mapDrizzleUserToDto(loan.user) : undefined,
    book: loan.book ? mapDrizzleBookToDto(loan.book) : undefined,
  };
}
