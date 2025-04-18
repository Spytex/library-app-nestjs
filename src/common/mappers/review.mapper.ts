import { plainToInstance } from 'class-transformer';
import {
  BookSelect,
  ReviewSelect,
  UserSelect,
} from '../../database/drizzle/schema';
import { ReviewDto } from '../../library/review/dto/review.dto';
import { Review } from '../../library/review/review.entity';

type ReviewSource =
  | Review
  | (ReviewSelect & { user?: UserSelect; book?: BookSelect });

export function mapToReviewDto<T extends ReviewSource | ReviewSource[]>(
  source: T,
): T extends ReviewSource[] ? ReviewDto[] : ReviewDto {
  return plainToInstance(ReviewDto, source, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  }) as T extends ReviewSource[] ? ReviewDto[] : ReviewDto;
}
