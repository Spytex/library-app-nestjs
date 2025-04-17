import { BookDto } from '../../book/dto/book.dto';
import { UserDto } from '../../../user/dto/user.dto';

export class ReviewDto {
  id: number;
  userId: number;
  bookId: number;
  loanId: number | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;

  user?: UserDto;
  book?: BookDto;
}
