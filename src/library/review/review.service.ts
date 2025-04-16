import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, bookId, loanId, rating, comment } = createReviewDto;

    const existingReview = await this.reviewRepository.findOneBy({
      userId,
      bookId,
    });

    if (existingReview) {
      throw new ConflictException(
        `User "${userId}" has already reviewed book "${bookId}".`,
      );
    }

    const newReview = this.reviewRepository.create({
      userId,
      bookId,
      loanId: loanId ?? null,
      rating,
      comment,
    });

    return this.reviewRepository.save(newReview);
  }

  async findBookReviews(
    bookId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Review[]> {
    const findOptions: FindManyOptions<Review> = {
      where: { bookId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    };

    return this.reviewRepository.find(findOptions);
  }

  async findUserReviews(
    userId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Review[]> {
    const findOptions: FindManyOptions<Review> = {
      where: { userId },
      relations: ['book'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    };
    return this.reviewRepository.find(findOptions);
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }
    return review;
  }

  async remove(id: number): Promise<void> {
    const result = await this.reviewRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }
  }
}
