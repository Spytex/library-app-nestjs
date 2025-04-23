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
import { Review } from '../src/library/review/review.entity';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { CreateBookDto } from '../src/library/book/dto/create-book.dto';
import { CreateLoanDto } from '../src/library/loan/dto/create-loan.dto';

describe('LibraryController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testBookAvailable: Book;
  let testBookBorrowed: Book;
  let testBookBooked: Book;

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
    const loanData: Partial<Loan> = { userId, bookId, status, ...dates };
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
      name: 'Lib User',
      email: `libuser-${Date.now()}@test.com`,
    });
    testBookAvailable = await createBookDirectly({
      title: 'Lib Available',
      author: 'Auth',
      isbn: `lib-avail-${Date.now()}`,
    });
    testBookBorrowed = await createBookDirectly(
      {
        title: 'Lib Borrowed',
        author: 'Auth',
        isbn: `lib-borrow-${Date.now()}`,
      },
      BookStatus.BORROWED,
    );
    testBookBooked = await createBookDirectly(
      { title: 'Lib Booked', author: 'Auth', isbn: `lib-booked-${Date.now()}` },
      BookStatus.BOOKED,
    );

    await createLoanDirectly(
      testUser.id,
      testBookBorrowed.id,
      LoanStatus.ACTIVE,
      { loanDate: new Date(), dueDate: new Date(Date.now() + 100000) },
    );
    await createLoanDirectly(
      testUser.id,
      testBookBooked.id,
      LoanStatus.BOOKED,
      { bookingDate: new Date() },
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /library/loans (Booking)', () => {
    let createLoanDto: CreateLoanDto;

    beforeEach(() => {
      createLoanDto = {
        userId: testUser.id,
        bookId: testBookAvailable.id,
      };
    });

    it('should successfully book an available book', async () => {
      return request(app.getHttpServer())
        .post('/library/loans')
        .send(createLoanDto)
        .expect(HttpStatus.CREATED)
        .then(async (response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toBeDefined();
          expect(response.body.data.userId).toEqual(testUser.id);
          expect(response.body.data.bookId).toEqual(testBookAvailable.id);
          expect(response.body.data.status).toEqual(LoanStatus.BOOKED);
          expect(response.body.data.bookingDate).toBeDefined();
          expect(response.body.data.loanDate).toBeNull();

          const bookRepo = dataSource.getRepository(Book);
          const updatedBook = await bookRepo.findOneByOrFail({
            id: testBookAvailable.id,
          });
          expect(updatedBook.status).toEqual(BookStatus.BOOKED);
        });
    });

    it('should fail to book a book that is already booked', async () => {
      const dtoForBooked = { userId: testUser.id, bookId: testBookBooked.id };
      return request(app.getHttpServer())
        .post('/library/loans')
        .send(dtoForBooked)
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.message).toContain('cannot be booked');
        });
    });

    it('should fail to book a book that is already borrowed', async () => {
      const dtoForBorrowed = {
        userId: testUser.id,
        bookId: testBookBorrowed.id,
      };
      return request(app.getHttpServer())
        .post('/library/loans')
        .send(dtoForBorrowed)
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.message).toContain('cannot be booked');
        });
    });

    it('should fail if user does not exist', async () => {
      const dtoInvalidUser = { ...createLoanDto, userId: 99999 };
      return request(app.getHttpServer())
        .post('/library/loans')
        .send(dtoInvalidUser)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if book does not exist', async () => {
      const dtoInvalidBook = { ...createLoanDto, bookId: 99999 };
      return request(app.getHttpServer())
        .post('/library/loans')
        .send(dtoInvalidBook)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /library/loans/:id/pickup', () => {
    let bookedLoan: Loan;

    beforeEach(async () => {
      bookedLoan = await dataSource.getRepository(Loan).findOneByOrFail({
        bookId: testBookBooked.id,
        status: LoanStatus.BOOKED,
      });
    });

    it('should successfully pickup a booked loan', async () => {
      return request(app.getHttpServer())
        .patch(`/library/loans/${bookedLoan.id}/pickup`)
        .send()
        .expect(HttpStatus.OK)
        .then(async (response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(bookedLoan.id);
          expect(response.body.data.status).toEqual(LoanStatus.ACTIVE);
          expect(response.body.data.loanDate).toBeDefined();
          expect(response.body.data.dueDate).toBeDefined();
          expect(response.body.data.bookingDate).toBeDefined();

          const bookRepo = dataSource.getRepository(Book);
          const updatedBook = await bookRepo.findOneByOrFail({
            id: testBookBooked.id,
          });
          expect(updatedBook.status).toEqual(BookStatus.BORROWED);
        });
    });

    it('should fail to pickup a loan that is not in BOOKED status', async () => {
      const activeLoan = await dataSource.getRepository(Loan).findOneByOrFail({
        bookId: testBookBorrowed.id,
        status: LoanStatus.ACTIVE,
      });
      return request(app.getHttpServer())
        .patch(`/library/loans/${activeLoan.id}/pickup`)
        .send()
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.error.message).toContain('cannot be picked up');
          expect(response.body.error.message).toContain('status ACTIVE');
        });
    });

    it('should return 404 if loan does not exist', async () => {
      return request(app.getHttpServer())
        .patch('/library/loans/99999/pickup')
        .send()
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /library/loans/:id/return', () => {
    let activeLoan: Loan;

    it('should successfully return an active loan', async () => {
      activeLoan = await dataSource.getRepository(Loan).findOneByOrFail({
        bookId: testBookBorrowed.id,
        status: LoanStatus.ACTIVE,
      });

      return request(app.getHttpServer())
        .patch(`/library/loans/${activeLoan.id}/return`)
        .send()
        .expect(HttpStatus.OK)
        .then(async (response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(activeLoan.id);
          expect(response.body.data.status).toEqual(LoanStatus.RETURNED);
          expect(response.body.data.returnDate).toBeDefined();

          const bookRepo = dataSource.getRepository(Book);
          const updatedBook = await bookRepo.findOneByOrFail({
            id: testBookBorrowed.id,
          });
          expect(updatedBook.status).toEqual(BookStatus.AVAILABLE);
        });
    });

    it('should fail to return a loan that is not ACTIVE or OVERDUE', async () => {
      const bookedLoan = await dataSource.getRepository(Loan).findOneByOrFail({
        bookId: testBookBooked.id,
        status: LoanStatus.BOOKED,
      });
      return request(app.getHttpServer())
        .patch(`/library/loans/${bookedLoan.id}/return`)
        .send()
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.error.message).toContain('cannot be returned');
          expect(response.body.error.message).toContain('status BOOKED');
        });
    });

    it('should return 404 if loan does not exist', async () => {
      return request(app.getHttpServer())
        .patch('/library/loans/99999/return')
        .send()
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
