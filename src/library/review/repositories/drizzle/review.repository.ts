import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  eq,
  count as drizzleCount,
  isNotNull,
  isNull,
  SQL,
} from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../../db/drizzle.module';
import * as schema from '../../../../db/schema';
import { CreateReviewDto } from '../../dto/create-review.dto';
import {
  IReviewRepository,
  IReviewCountCriteria,
} from '../review.repository.interface';
import { ReviewDto } from '../../dto/review.dto';
import { ReviewSelect, UserSelect, BookSelect } from '../../../../db/schema';
import { BookStatus } from '../../../book/book.entity';

@Injectable()
export class DrizzleReviewRepository implements IReviewRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  private mapToDto(
    review: ReviewSelect & { user?: UserSelect; book?: BookSelect },
  ): ReviewDto {
    return {
      id: review.id,
      userId: review.userId,
      bookId: review.bookId,
      loanId: review.loanId ?? null,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user
        ? {
            id: review.user.id,
            name: review.user.name,
            email: review.user.email,
            createdAt: review.user.createdAt,
            updatedAt: review.user.updatedAt,
          }
        : undefined,
      book: review.book
        ? {
            id: review.book.id,
            title: review.book.title,
            author: review.book.author,
            isbn: review.book.isbn,
            description: review.book.description ?? null,
            status: review.book.status as BookStatus,
            createdAt: review.book.createdAt,
            updatedAt: review.book.updatedAt,
          }
        : undefined,
    };
  }

  async create(createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const result = await this.db
      .insert(schema.reviews)
      .values(createReviewDto)
      .returning();
    return this.mapToDto(result[0]);
  }

  async findById(id: number): Promise<ReviewDto | null> {
    const result = await this.db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
      with: { user: true, book: true },
    });
    return result ? this.mapToDto(result) : null;
  }

  async findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewDto | null> {
    const result = await this.db.query.reviews.findFirst({
      where: and(
        eq(schema.reviews.userId, userId),
        eq(schema.reviews.bookId, bookId),
      ),
      with: { user: true, book: true },
    });
    return result ? this.mapToDto(result) : null;
  }

  async findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]> {
    const reviews = await this.db.query.reviews.findMany({
      where: eq(schema.reviews.bookId, bookId),
      limit: limit,
      offset: offset,
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      with: { user: true },
    });
    return reviews.map(this.mapToDto);
  }

  async findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewDto[]> {
    const reviews = await this.db.query.reviews.findMany({
      where: eq(schema.reviews.userId, userId),
      limit: limit,
      offset: offset,
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      with: { book: true },
    });
    return reviews.map(this.mapToDto);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.reviews)
      .where(eq(schema.reviews.id, id))
      .returning({ id: schema.reviews.id });
    return result.length > 0;
  }

  async count(criteria?: IReviewCountCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.userId)
      conditions.push(eq(schema.reviews.userId, criteria.userId));
    if (criteria?.bookId)
      conditions.push(eq(schema.reviews.bookId, criteria.bookId));
    if (criteria?.rating)
      conditions.push(eq(schema.reviews.rating, criteria.rating));
    if (criteria?.hasComment !== undefined) {
      conditions.push(
        criteria.hasComment
          ? isNotNull(schema.reviews.comment)
          : isNull(schema.reviews.comment),
      );
    }

    const result = await this.db
      .select({ count: drizzleCount(schema.reviews.id) })
      .from(schema.reviews)
      .where(and(...conditions));
    return result[0].count;
  }
}
