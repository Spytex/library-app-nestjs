import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Review } from '../../review.entity';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { IReviewRepository } from '../review.repository.interface';

@Injectable()
export class TypeOrmReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const newReview = this.reviewRepository.create(createReviewDto);
    return this.reviewRepository.save(newReview);
  }

  async findById(id: number): Promise<Review | null> {
    return this.reviewRepository.findOneBy({ id });
  }

  async findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<Review | null> {
    return this.reviewRepository.findOneBy({ userId, bookId });
  }

  async findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { bookId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.reviewRepository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }

  async count(criteria?: FindOptionsWhere<Review>): Promise<number> {
    return this.reviewRepository.count({ where: criteria });
  }
}
