import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../../db/drizzle.module';
import * as schema from '../../../../db/schema';
import { CreateReviewDto } from '../../dto/create-review.dto';
import {
  IReviewRepository,
  ReviewRepresentation,
} from '../review.repository.interface';

@Injectable()
export class DrizzleReviewRepository implements IReviewRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewRepresentation> {
    const result = await this.db
      .insert(schema.reviews)
      .values(createReviewDto)
      .returning();
    return result[0];
  }

  async findById(id: number): Promise<ReviewRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async findUserReviewForBook(
    userId: number,
    bookId: number,
  ): Promise<ReviewRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.userId, userId),
          eq(schema.reviews.bookId, bookId),
        ),
      )
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async findBookReviews(
    bookId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewRepresentation[]> {
    return this.db.query.reviews.findMany({
      where: eq(schema.reviews.bookId, bookId),
      limit: limit,
      offset: offset,
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      with: { user: true },
    });
  }

  async findUserReviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ReviewRepresentation[]> {
    return this.db.query.reviews.findMany({
      where: eq(schema.reviews.userId, userId),
      limit: limit,
      offset: offset,
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      with: { book: true },
    });
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.reviews)
      .where(eq(schema.reviews.id, id))
      .returning({ id: schema.reviews.id });
    return result.length > 0;
  }

  async count(criteria?: any): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reviews);
    return Number(result[0].count);
  }
}
