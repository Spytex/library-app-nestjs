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
  ReviewRepresentation,
} from './repositories/review.repository.interface';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewRepresentation> {
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

  async findBookReviews(
    bookId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ReviewRepresentation[]> {
    return this.reviewRepository.findBookReviews(bookId, limit, offset);
  }

  async findUserReviews(
    userId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ReviewRepresentation[]> {
    return this.reviewRepository.findUserReviews(userId, limit, offset);
  }

  async findOne(id: number): Promise<ReviewRepresentation> {
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
}
