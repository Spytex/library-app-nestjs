import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseTransformerInterceptor } from '../src/common/interceptors/response-transformer.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { User } from '../src/user/user.entity';
import { Book } from '../src/library/book/book.entity';
import { Loan } from '../src/library/loan/loan.entity';
import { Review } from '../src/library/review/review.entity';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { CreateBookDto } from '../src/library/book/dto/create-book.dto';
import { CreateReviewDto } from '../src/library/review/dto/create-review.dto';

describe('ReviewController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testBook: Book;
  let testLoan: Loan | null = null;

  const createUserDirectly = async (dto: CreateUserDto): Promise<User> => {
    const repo = dataSource.getRepository(User);
    const user = repo.create(dto);
    return await repo.save(user);
  };

  const createBookDirectly = async (dto: CreateBookDto): Promise<Book> => {
    const repo = dataSource.getRepository(Book);
    const book = repo.create(dto);
    return await repo.save(book);
  };

  const createReviewDirectly = async (
    dto: CreateReviewDto,
  ): Promise<Review> => {
    const repo = dataSource.getRepository(Review);
    const reviewData = {
      ...dto,
      user: { id: dto.userId } as User,
      book: { id: dto.bookId } as Book,
      ...(dto.loanId && { loan: { id: dto.loanId } as Loan }),
    };
    const review = repo.create(reviewData);
    return await repo.save(review);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseTransformerInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  beforeEach(async () => {
    const reviewRepo = dataSource.getRepository(Review);
    const loanRepo = dataSource.getRepository(Loan);
    const bookRepo = dataSource.getRepository(Book);
    const userRepo = dataSource.getRepository(User);

    try {
      await reviewRepo.delete({});
      await loanRepo.delete({});
      await bookRepo.delete({});
      await userRepo.delete({});
    } catch (error) {
      console.error('Error during table cleanup:', error);
      throw error;
    }

    testUser = await createUserDirectly({
      name: 'Review User',
      email: `reviewuser-${Date.now()}@test.com`,
    });
    testBook = await createBookDirectly({
      title: 'Review Book',
      author: 'Auth',
      isbn: `rev-${Date.now()}`,
    });
    testLoan = null;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /reviews (handled by ReviewController)', () => {
    let createReviewDto: CreateReviewDto;

    beforeEach(() => {
      createReviewDto = {
        userId: testUser.id,
        bookId: testBook.id,
        rating: 4,
        comment: 'Good book!',
      };
    });

    it('should create a review successfully', async () => {
      return request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toBeDefined();
          expect(response.body.data.userId).toEqual(testUser.id);
          expect(response.body.data.bookId).toEqual(testBook.id);
          expect(response.body.data.rating).toEqual(4);
          expect(response.body.data.comment).toEqual('Good book!');
          expect(response.body.data.loanId).toBeNull();
        });
    });

    it('should create a review linked to a loan if loanId is provided', async () => {
      const loanRepo = dataSource.getRepository(Loan);
      testLoan = await loanRepo.save(
        loanRepo.create({
          userId: testUser.id,
          bookId: testBook.id,
          status: 'RETURNED' as any,
        }),
      );

      const dtoWithLoan = { ...createReviewDto, loanId: testLoan?.id };

      return request(app.getHttpServer())
        .post('/reviews')
        .send(dtoWithLoan)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.loanId).toEqual(testLoan?.id);
        });
    });

    it('should fail if user does not exist (FK constraint)', async () => {
      const dtoInvalidUser = { ...createReviewDto, userId: 99999 };
      return request(app.getHttpServer())
        .post('/reviews')
        .send(dtoInvalidUser)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('INTERNAL_SERVER_ERROR');
          expect(response.body.error.message).toEqual(
            'An unexpected error occurred',
          );
        });
    });

    it('should fail if book does not exist (FK constraint)', async () => {
      const dtoInvalidBook = { ...createReviewDto, bookId: 99999 };
      return request(app.getHttpServer())
        .post('/reviews')
        .send(dtoInvalidBook)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('INTERNAL_SERVER_ERROR');
          expect(response.body.error.message).toEqual(
            'An unexpected error occurred',
          );
        });
    });

    it('should fail if provided loanId does not exist (FK constraint)', async () => {
      const dtoInvalidLoan = { ...createReviewDto, loanId: 99999 };
      return request(app.getHttpServer())
        .post('/reviews')
        .send(dtoInvalidLoan)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('INTERNAL_SERVER_ERROR');
          expect(response.body.error.message).toEqual(
            'An unexpected error occurred',
          );
        });
    });

    it('should fail validation for invalid rating (e.g., 0 or 6)', async () => {
      const dtoInvalidRating = { ...createReviewDto, rating: 6 };
      return request(app.getHttpServer())
        .post('/reviews')
        .send(dtoInvalidRating)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');

          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message).toContain(
            'rating must not be greater than 5',
          );
        });
    });
  });

  describe('GET /reviews', () => {
    it('should get a list of all reviews (paginated)', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `u2-${Date.now()}@test.com`,
      });
      await createReviewDirectly({
        userId: user2.id,
        bookId: testBook.id,
        rating: 3,
      });

      return request(app.getHttpServer())
        .get('/reviews?limit=5')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(2);
          expect(response.body.meta.pagination.totalItems).toEqual(2);
        });
    });

    it('should filter reviews by userId', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `u2-${Date.now()}@test.com`,
      });
      await createReviewDirectly({
        userId: user2.id,
        bookId: testBook.id,
        rating: 3,
      });

      return request(app.getHttpServer())
        .get(`/reviews?userId=${testUser.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].userId).toEqual(testUser.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should filter reviews by bookId', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const book2 = await createBookDirectly({
        title: 'Book 2',
        author: 'Auth 2',
        isbn: `b2-${Date.now()}`,
      });
      await createReviewDirectly({
        userId: testUser.id,
        bookId: book2.id,
        rating: 2,
      });

      return request(app.getHttpServer())
        .get(`/reviews?bookId=${testBook.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].bookId).toEqual(testBook.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should filter reviews by rating', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `u2-${Date.now()}@test.com`,
      });
      await createReviewDirectly({
        userId: user2.id,
        bookId: testBook.id,
        rating: 3,
      });

      return request(app.getHttpServer())
        .get(`/reviews?rating=5`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].rating).toEqual(5);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });
  });

  describe('GET /reviews/:id', () => {
    it('should get a specific review by ID', async () => {
      const review = await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
        comment: 'Excellent',
      });

      return request(app.getHttpServer())
        .get(`/reviews/${review.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(review.id);
          expect(response.body.data.comment).toEqual('Excellent');
        });
    });

    it('should return 404 for non-existent review ID', async () => {
      return request(app.getHttpServer())
        .get('/reviews/99999')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid review ID format', async () => {
      return request(app.getHttpServer())
        .get('/reviews/invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete a review successfully', async () => {
      const review = await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });

      return request(app.getHttpServer())
        .delete(`/reviews/${review.id}`)
        .expect(HttpStatus.NO_CONTENT)
        .then(async () => {
          const repo = dataSource.getRepository(Review);
          const findReview = await repo.findOneBy({ id: review.id });
          expect(findReview).toBeNull();
        });
    });

    it('should return 404 when trying to delete non-existent review', async () => {
      return request(app.getHttpServer())
        .delete('/reviews/99999')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid review ID format', async () => {
      return request(app.getHttpServer())
        .delete('/reviews/invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users/:userId/reviews', () => {
    it('should get reviews for a specific user via path param', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `u2-${Date.now()}@test.com`,
      });
      await createReviewDirectly({
        userId: user2.id,
        bookId: testBook.id,
        rating: 3,
      });

      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].userId).toEqual(testUser.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should return OK with empty list if user exists but has no reviews', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });

    it('should return OK with empty list if user does not exist', async () => {
      return request(app.getHttpServer())
        .get(`/users/99999/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });
  });

  describe('GET /books/:bookId/reviews', () => {
    it('should get reviews for a specific book via path param', async () => {
      await createReviewDirectly({
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
      });
      const book2 = await createBookDirectly({
        title: 'Book 2',
        author: 'Auth 2',
        isbn: `b2-${Date.now()}`,
      });
      await createReviewDirectly({
        userId: testUser.id,
        bookId: book2.id,
        rating: 2,
      });

      return request(app.getHttpServer())
        .get(`/books/${testBook.id}/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].bookId).toEqual(testBook.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should return OK with empty list if book exists but has no reviews', async () => {
      return request(app.getHttpServer())
        .get(`/books/${testBook.id}/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });

    it('should return OK with empty list if book does not exist', async () => {
      return request(app.getHttpServer())
        .get(`/books/99999/reviews`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });
  });
});
