import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { mapToReviewDto } from '../../../../common/mappers';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { FindReviewsQueryDto } from '../../dto/find-reviews-query.dto';
import { ReviewDto } from '../../dto/review.dto';
import { Review } from '../../review.entity';
import {
  IReviewFilterCriteria,
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
    // Eager load relations after save if needed, or adjust mapper
    const reviewWithRelations = await this.findById(savedReview.id);
    return reviewWithRelations!; // Assuming findById handles not found
  }

  async findAll(query: FindReviewsQueryDto): Promise<ReviewDto[]> {
    const { limit = 10, page = 1, userId, bookId, rating } = query;
    const offset = (page - 1) * limit;
    const where: FindOptionsWhere<Review> = {};

    if (userId) where.userId = userId;
    if (bookId) where.bookId = bookId;
    if (rating) where.rating = rating;

    const reviews = await this.reviewRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['user', 'book'], // Adjust relations as needed for list view
    });
    return reviews.map(mapToReviewDto);
  }

  async findById(id: number): Promise<ReviewDto | null> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'book'], // Ensure relations are loaded for detail view
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

  async remove(id: number): Promise<boolean> {
    const result = await this.reviewRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async count(criteria?: IReviewFilterCriteria): Promise<number> {
    const where: FindOptionsWhere<Review> = {};
    if (criteria?.userId) where.userId = criteria.userId;
    if (criteria?.bookId) where.bookId = criteria.bookId;
    if (criteria?.rating) where.rating = criteria.rating;
    // Note: hasComment criteria removed as it wasn't in FindReviewsQueryDto
    return this.reviewRepository.count({ where });
  }
}
