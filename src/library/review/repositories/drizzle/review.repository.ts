import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  count as drizzleCount,
  eq,
  isNotNull,
  isNull,
  SQL,
  desc,
} from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from 'src/database/drizzle/drizzle.module';
import * as schema from 'src/database/drizzle/schema';
import { mapToReviewDto } from '../../../../common/mappers';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { FindReviewsQueryDto } from '../../dto/find-reviews-query.dto';
import { ReviewDto } from '../../dto/review.dto';
import {
  IReviewFilterCriteria,
  IReviewRepository,
} from '../review.repository.interface';

@Injectable()
export class DrizzleReviewRepository implements IReviewRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewDto> {
    const result = await this.db
      .insert(schema.reviews)
      .values(createReviewDto)
      .returning();
    // Fetch again with relations for consistency
    const reviewWithRelations = await this.findById(result[0].id);
    return reviewWithRelations!;
  }

  async findAll(query: FindReviewsQueryDto): Promise<ReviewDto[]> {
    const { limit = 10, page = 1, userId, bookId, rating } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (userId) conditions.push(eq(schema.reviews.userId, userId));
    if (bookId) conditions.push(eq(schema.reviews.bookId, bookId));
    if (rating) conditions.push(eq(schema.reviews.rating, rating));

    const reviews = await this.db.query.reviews.findMany({
      where: and(...conditions),
      limit: limit,
      offset: offset,
      orderBy: [desc(schema.reviews.createdAt)],
      with: { user: true, book: true }, // Adjust relations as needed
    });
    return reviews.map(mapToReviewDto);
  }

  async findById(id: number): Promise<ReviewDto | null> {
    const result = await this.db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
      with: { user: true, book: true },
    });
    return result ? mapToReviewDto(result) : null;
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
    return result ? mapToReviewDto(result) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.reviews)
      .where(eq(schema.reviews.id, id))
      .returning({ id: schema.reviews.id });
    return result.length > 0;
  }

  async count(criteria?: IReviewFilterCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.userId)
      conditions.push(eq(schema.reviews.userId, criteria.userId));
    if (criteria?.bookId)
      conditions.push(eq(schema.reviews.bookId, criteria.bookId));
    if (criteria?.rating)
      conditions.push(eq(schema.reviews.rating, criteria.rating));
    // Note: hasComment criteria removed

    const result = await this.db
      .select({ count: drizzleCount(schema.reviews.id) })
      .from(schema.reviews)
      .where(and(...conditions));
    return result[0].count;
  }
}
