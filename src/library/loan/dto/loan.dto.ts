import { LoanStatus } from '../loan.entity';
import { BookDto } from '../../book/dto/book.dto';
import { UserDto } from '../../../user/dto/user.dto';

export class LoanDto {
  id: number;
  userId: number;
  bookId: number;
  bookingDate: Date | null;
  loanDate: Date | null;
  dueDate: Date | null;
  returnDate: Date | null;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;

  user?: UserDto;
  book?: BookDto;
}
