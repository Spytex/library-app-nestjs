import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserService } from '../user/user.service';
import { BookService } from '../book/book.service';
import { LoanService } from '../loan/loan.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    @Inject(forwardRef(() => BookService))
    private bookService: BookService,

    @Inject(forwardRef(() => LoanService))
    private loanService: LoanService,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, bookId, loanId, rating, comment } = createReviewDto;

    await this.userService.findOne(userId);
    await this.bookService.findOne(bookId);

    if (loanId) {
      const loan = await this.loanService.findOne(loanId);
      if (loan.userId !== userId || loan.bookId !== bookId) {
        throw new BadRequestException(
          `Loan with ID "${loanId}" does not match the provided user and book.`,
        );
      }
    }

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
    await this.bookService.findOne(bookId);

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
    await this.userService.findOne(userId);

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
