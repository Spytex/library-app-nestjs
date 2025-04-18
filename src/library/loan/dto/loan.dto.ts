import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../../user/dto/user.dto';
import { BookDto } from '../../book/dto/book.dto';
import { LoanStatus } from '../loan.entity';

export class LoanDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  bookId: number;

  @Expose()
  @Type(() => Date)
  bookingDate: Date | null;

  @Expose()
  @Type(() => Date)
  loanDate: Date | null;

  @Expose()
  @Type(() => Date)
  dueDate: Date | null;

  @Expose()
  @Type(() => Date)
  returnDate: Date | null;

  @Expose()
  status: LoanStatus;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @Type(() => UserDto)
  user?: UserDto;

  @Expose()
  @Type(() => BookDto)
  book?: BookDto;
}
