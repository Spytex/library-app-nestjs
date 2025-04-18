import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../../user/dto/user.dto';
import { BookDto } from '../../book/dto/book.dto';

export class ReviewDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  bookId: number;

  @Expose()
  loanId: number | null;

  @Expose()
  rating: number;

  @Expose()
  comment: string | null;

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
