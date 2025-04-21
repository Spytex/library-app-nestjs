import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from './repositories/review.repository.interface';
import { ReviewDto } from './dto/review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import {
  IPaginatedResult,
  createPaginatedResponse,
} from '../../common/utils/pagination.utils';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const { userId, bookId } = createReviewDto;

    const existingReview = await this.reviewRepository.findUserReviewForBook(
      userId,
      bookId,
    );

    if (existingReview) {
      throw new ConflictException(
        `User "${userId}" has already reviewed book "${bookId}".`,
      );
    }

    return this.reviewRepository.create(createReviewDto);
  }

  async findAll(
    query: FindReviewsQueryDto,
  ): Promise<IPaginatedResult<ReviewDto>> {
    const { page = 1, limit = 10, ...filters } = query;
    const items = await this.reviewRepository.findAll(query);
    const totalItems = await this.reviewRepository.count(filters);
    return createPaginatedResponse<ReviewDto>(items, totalItems, page, limit);
  }

  async findOne(id: number): Promise<ReviewDto> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }
    return review;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.reviewRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(
        `Review with ID "${id}" not found or could not be deleted.`,
      );
    }
  }

  // Keep specific finders if needed, but they now use the general findAll logic
  async findBookReviews(
    bookId: number,
    query: FindReviewsQueryDto,
  ): Promise<IPaginatedResult<ReviewDto>> {
    query.bookId = bookId; // Ensure bookId is set
    return this.findAll(query);
  }

  async findUserReviews(
    userId: number,
    query: FindReviewsQueryDto,
  ): Promise<IPaginatedResult<ReviewDto>> {
    query.userId = userId; // Ensure userId is set
    return this.findAll(query);
  }
}
