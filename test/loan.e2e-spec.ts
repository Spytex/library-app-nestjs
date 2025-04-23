import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseTransformerInterceptor } from '../src/common/interceptors/response-transformer.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { User } from '../src/user/user.entity';
import { Book, BookStatus } from '../src/library/book/book.entity';
import { Loan, LoanStatus } from '../src/library/loan/loan.entity';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { CreateBookDto } from '../src/library/book/dto/create-book.dto';
import { Review } from '../src/library/review/review.entity';

describe('LoanController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testBookAvailable: Book;
  let testBookBorrowed: Book;

  const createUserDirectly = async (dto: CreateUserDto): Promise<User> => {
    const repo = dataSource.getRepository(User);
    const user = repo.create(dto);
    return await repo.save(user);
  };

  const createBookDirectly = async (
    dto: CreateBookDto,
    status: BookStatus = BookStatus.AVAILABLE,
  ): Promise<Book> => {
    const repo = dataSource.getRepository(Book);
    const book = repo.create({ ...dto, status });
    return await repo.save(book);
  };

  const createLoanDirectly = async (
    userId: number,
    bookId: number,
    status: LoanStatus,
    dates: Partial<Loan> = {},
  ): Promise<Loan> => {
    const repo = dataSource.getRepository(Loan);
    const loanData: Partial<Loan> = {
      userId,
      bookId,
      status,
      bookingDate: dates.bookingDate,
      loanDate: dates.loanDate,
      dueDate: dates.dueDate,
      returnDate: dates.returnDate,
    };
    const loan = repo.create(loanData);
    return await repo.save(loan);
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
      name: 'Loan User',
      email: `loanuser-${Date.now()}@test.com`,
    });
    testBookAvailable = await createBookDirectly({
      title: 'Available Book',
      author: 'Auth',
      isbn: `111-${Date.now()}`,
    });
    testBookBorrowed = await createBookDirectly(
      { title: 'Borrowed Book', author: 'Auth', isbn: `222-${Date.now()}` },
      BookStatus.BORROWED,
    );

    await createLoanDirectly(
      testUser.id,
      testBookBorrowed.id,
      LoanStatus.ACTIVE,
      {
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /loans', () => {
    it('should get a list of all loans (paginated)', async () => {
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `user2-${Date.now()}@test.com`,
      });
      const book2 = await createBookDirectly({
        title: 'Book 2',
        author: 'Auth 2',
        isbn: `333-${Date.now()}`,
      });
      await createLoanDirectly(user2.id, book2.id, LoanStatus.BOOKED, {
        bookingDate: new Date(),
      });

      return request(app.getHttpServer())
        .get('/loans?limit=5')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toBeGreaterThanOrEqual(2);
          expect(response.body.meta.pagination).toBeDefined();
          expect(
            response.body.meta.pagination.totalItems,
          ).toBeGreaterThanOrEqual(2);
        });
    });

    it('should filter loans by userId', async () => {
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `user2-${Date.now()}@test.com`,
      });
      const book2 = await createBookDirectly({
        title: 'Book 2',
        author: 'Auth 2',
        isbn: `333-${Date.now()}`,
      });
      await createLoanDirectly(user2.id, book2.id, LoanStatus.BOOKED);

      return request(app.getHttpServer())
        .get(`/loans?userId=${testUser.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].userId).toEqual(testUser.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should filter loans by bookId', async () => {
      return request(app.getHttpServer())
        .get(`/loans?bookId=${testBookBorrowed.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].bookId).toEqual(testBookBorrowed.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should filter loans by status', async () => {
      return request(app.getHttpServer())
        .get(`/loans?status=${LoanStatus.ACTIVE}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].status).toEqual(LoanStatus.ACTIVE);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });
  });

  describe('GET /loans/:id', () => {
    it('should get a specific loan by ID', async () => {
      const loan = await dataSource
        .getRepository(Loan)
        .findOneByOrFail({ bookId: testBookBorrowed.id });

      return request(app.getHttpServer())
        .get(`/loans/${loan.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(loan.id);
          expect(response.body.data.bookId).toEqual(testBookBorrowed.id);
          expect(response.body.data.userId).toEqual(testUser.id);
        });
    });

    it('should return 404 for non-existent loan ID', async () => {
      return request(app.getHttpServer())
        .get('/loans/99999')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid loan ID format', async () => {
      return request(app.getHttpServer())
        .get('/loans/invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users/:userId/loans', () => {
    it('should get loans for a specific user', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/loans`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].userId).toEqual(testUser.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should return empty list for user with no loans', async () => {
      const user2 = await createUserDirectly({
        name: 'User 2',
        email: `user2-${Date.now()}@test.com`,
      });
      return request(app.getHttpServer())
        .get(`/users/${user2.id}/loans`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(0);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });

    it('should return 200 OK with empty list for non-existent user ID', async () => {
      return request(app.getHttpServer())
        .get('/users/99999/loans')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });
  });

  describe('GET /books/:bookId/loans', () => {
    it('should get loans for a specific book', async () => {
      return request(app.getHttpServer())
        .get(`/books/${testBookBorrowed.id}/loans`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].bookId).toEqual(testBookBorrowed.id);
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should return empty list for book with no loans', async () => {
      return request(app.getHttpServer())
        .get(`/books/${testBookAvailable.id}/loans`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.length).toEqual(0);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });

    it('should return 200 OK with empty list for non-existent book ID', async () => {
      return request(app.getHttpServer())
        .get('/books/99999/loans')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });
  });
});
