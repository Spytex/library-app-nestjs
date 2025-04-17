import { Review } from '../../library/review/review.entity';
import { ReviewDto } from '../../library/review/dto/review.dto';
import { mapUserToDto, mapDrizzleUserToDto } from './user.mapper';
import { mapBookToDto, mapDrizzleBookToDto } from './book.mapper';
import {
  BookSelect,
  ReviewSelect,
  UserSelect,
} from 'src/database/drizzle/schema';

export function mapReviewToDto(review: Review): ReviewDto {
  return {
    id: review.id,
    userId: review.userId,
    bookId: review.bookId,
    loanId: review.loanId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user ? mapUserToDto(review.user) : undefined,
    book: review.book ? mapBookToDto(review.book) : undefined,
  };
}

export function mapDrizzleReviewToDto(
  review: ReviewSelect & { user?: UserSelect; book?: BookSelect },
): ReviewDto {
  return {
    id: review.id,
    userId: review.userId,
    bookId: review.bookId,
    loanId: review.loanId ?? null,
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user ? mapDrizzleUserToDto(review.user) : undefined,
    book: review.book ? mapDrizzleBookToDto(review.book) : undefined,
  };
}
