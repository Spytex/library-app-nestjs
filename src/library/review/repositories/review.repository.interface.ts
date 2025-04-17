import { CreateReviewDto } from '../dto/create-review.dto';
import { Review } from '../review.entity';
import { ReviewSelect } from '../../../db/schema';

export type ReviewRepresentation = Review | ReviewSelect;

export interface IReviewRepository {
  create(createReviewDto: CreateReviewDto): Promise<ReviewRepresentation>;
  findById(id: number): Promise<ReviewRepresentation | null>;
  findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewRepresentation | null>;
  findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewRepresentation[]>;
  findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewRepresentation[]>;
  remove(id: number): Promise<boolean>;
  count(criteria?: any): Promise<number>;
}

export const REVIEW_REPOSITORY = 'IReviewRepository';
