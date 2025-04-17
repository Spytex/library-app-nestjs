import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../../db/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';
import { reviews } from '../../db/schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { eq, desc } from 'drizzle-orm';

type DrizzleDB = PostgresJsDatabase<typeof schema>;
type ReviewSelect = typeof schema.reviews.$inferSelect;

@Injectable()
export class ReviewService {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private db: DrizzleDB,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewSelect> {
    const { userId, bookId, loanId, rating, comment } = createReviewDto;
    try {
      const [newReview] = await this.db
        .insert(reviews)
        .values({
          userId,
          bookId,
          loanId: loanId ?? null,
          rating,
          comment,
        })
        .returning();
      return newReview;
    } catch (error) {
      if (
        error.code === '23505' &&
        error.constraint === 'reviews_user_book_unique'
      ) {
        throw new ConflictException(
          `User "${userId}" has already reviewed book "${bookId}".`,
        );
      }
      throw error;
    }
  }

  async findBookReviews(
    bookId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    return this.db.query.reviews.findMany({
      where: eq(reviews.bookId, bookId),
      orderBy: desc(reviews.createdAt),
      limit: limit,
      offset: offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findUserReviews(
    userId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    return this.db.query.reviews.findMany({
      where: eq(reviews.userId, userId),
      orderBy: desc(reviews.createdAt),
      limit: limit,
      offset: offset,
      with: {
        book: true,
      },
    });
  }

  async findOne(id: number): Promise<any> {
    const review = await this.db.query.reviews.findFirst({
      where: eq(reviews.id, id),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        book: true,
      },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }
    return review;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.db.delete(reviews).where(eq(reviews.id, id));
  }
}
