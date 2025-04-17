import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from './review.entity';
import { REVIEW_REPOSITORY } from './repositories/review.repository.interface';
import { TypeOrmReviewRepository } from './repositories/typeorm/review.repository';
import { DrizzleReviewRepository } from './repositories/drizzle/review.repository';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../db/drizzle.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Review])],
  providers: [
    ReviewService,
    {
      provide: REVIEW_REPOSITORY,
      inject: [ConfigService, getRepositoryToken(Review), DRIZZLE_CLIENT],
      useFactory: (
        configService: ConfigService,
        typeOrmReviewRepo: Repository<Review>,
        drizzleDb: DrizzleDB,
      ) => {
        const ormType = configService.get<string>('DB_ORM_TYPE');
        if (ormType === 'drizzle') {
          console.log('Using DrizzleReviewRepository');
          return new DrizzleReviewRepository(drizzleDb);
        } else {
          console.log('Using TypeOrmReviewRepository');
          return new TypeOrmReviewRepository(typeOrmReviewRepo);
        }
      },
    },
  ],
  controllers: [ReviewController],
  exports: [ReviewService, REVIEW_REPOSITORY],
})
export class ReviewModule {}
