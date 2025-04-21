import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { FindReviewsQueryDto } from '../dto/find-reviews-query.dto';
import { ReviewDto } from '../dto/review.dto';

export type IReviewFilterCriteria = Omit<
  FindReviewsQueryDto,
  keyof PaginationQueryDto
>;

export interface IReviewRepository {
  create(createReviewDto: CreateReviewDto): Promise<ReviewDto>;
  findAll(query: FindReviewsQueryDto): Promise<ReviewDto[]>;
  findById(id: number): Promise<ReviewDto | null>;
  findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewDto | null>;
  remove(id: number): Promise<boolean>;
  count(criteria?: IReviewFilterCriteria): Promise<number>;
}

export const REVIEW_REPOSITORY = 'IReviewRepository';
