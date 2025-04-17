import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewDto } from '../dto/review.dto';

export interface IReviewCountCriteria {
  userId?: number;
  bookId?: number;
  rating?: number;
  hasComment?: boolean;
}

export interface IReviewRepository {
  create(createReviewDto: CreateReviewDto): Promise<ReviewDto>;
  findById(id: number): Promise<ReviewDto | null>;
  findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewDto | null>;
  findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]>;
  findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]>;
  remove(id: number): Promise<boolean>;
  count(criteria?: IReviewCountCriteria): Promise<number>;
}

export const REVIEW_REPOSITORY = 'IReviewRepository';
