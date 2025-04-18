import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { mapToReviewDto } from '../../../../common/mappers';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { ReviewDto } from '../../dto/review.dto';
import { Review } from '../../review.entity';
import {
  IReviewCountCriteria,
  IReviewRepository,
} from '../review.repository.interface';

@Injectable()
export class TypeOrmReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const newReview = this.reviewRepository.create(createReviewDto);
    const savedReview = await this.reviewRepository.save(newReview);
    return mapToReviewDto(savedReview);
  }

  async findById(id: number): Promise<ReviewDto | null> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });
    return review ? mapToReviewDto(review) : null;
  }

  async findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewDto | null> {
    const review = await this.reviewRepository.findOne({
      where: { userId, bookId },
      relations: ['user', 'book'],
    });
    return review ? mapToReviewDto(review) : null;
  }

  async findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { bookId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return reviews.map(mapToReviewDto);
  }

  async findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
    return reviews.map(mapToReviewDto);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.reviewRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async count(criteria?: IReviewCountCriteria): Promise<number> {
    const where: FindOptionsWhere<Review> = {};
    if (criteria?.userId) where.userId = criteria.userId;
    if (criteria?.bookId) where.bookId = criteria.bookId;
    if (criteria?.rating) where.rating = criteria.rating;
    if (criteria?.hasComment !== undefined) {
      where.comment = criteria.hasComment ? Not(IsNull()) : IsNull();
    }
    return this.reviewRepository.count({ where });
  }
}
