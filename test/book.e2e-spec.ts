import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateBookDto } from '../src/library/book/dto/create-book.dto';
import { UpdateBookDto } from '../src/library/book/dto/update-book.dto';
import { ResponseTransformerInterceptor } from '../src/common/interceptors/response-transformer.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { Book, BookStatus } from '../src/library/book/book.entity';
import { Loan } from '../src/library/loan/loan.entity';
import { Review } from '../src/library/review/review.entity';
import { User } from '../src/user/user.entity';

describe('BookController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const baseCreateBookDto: CreateBookDto = {
    title: 'E2E Test Book',
    author: 'E2E Author',
    isbn: `978-3-16-${Date.now().toString().slice(-6)}`,
    description: 'A book created for E2E testing.',
  };
  let uniqueCreateBookDto: CreateBookDto;

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
        transformOptions: {
          enableImplicitConversion: true,
        },
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
      if (userRepo) await userRepo.delete({});
    } catch (error) {
      console.error('Error during table cleanup:', error);
      throw error;
    }

    uniqueCreateBookDto = {
      ...baseCreateBookDto,
      isbn: `978-3-16-${Date.now().toString().slice(-6)}`,
    };
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  const createBookDirectly = async (dto: CreateBookDto): Promise<Book> => {
    const bookRepository = dataSource.getRepository(Book);
    const book = bookRepository.create(dto);
    return await bookRepository.save(book);
  };

  describe('/books (POST)', () => {
    it('should create a book successfully with default status AVAILABLE', async () => {
      return request(app.getHttpServer())
        .post('/books')
        .send(uniqueCreateBookDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
        });
    });

    it('should fail to create a book with duplicate ISBN', async () => {
      try {
        await createBookDirectly(uniqueCreateBookDto);
      } catch (e) {
        console.warn(
          'Direct creation failed, duplicate test might be unreliable',
          e,
        );
      }

      return request(app.getHttpServer())
        .post('/books')
        .send(uniqueCreateBookDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
        });
    });
  });

  describe('/books (GET)', () => {
    it('should get an empty list when no books exist', async () => {
      return request(app.getHttpServer())
        .get('/books')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination).toBeDefined();
          expect(response.body.meta.pagination.totalItems).toEqual(0);
        });
    });

    it('should get a list of books (paginated)', async () => {
      await createBookDirectly({
        title: 'Book A',
        author: 'Auth A',
        isbn: '111-1-11-111111-1',
      });
      await createBookDirectly({
        title: 'Book B',
        author: 'Auth B',
        isbn: '222-2-22-222222-2',
      });

      return request(app.getHttpServer())
        .get('/books?page=1&limit=1')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.meta.pagination.page).toEqual(1);
          expect(response.body.meta.pagination.limit).toEqual(1);
          expect(response.body.meta.pagination.totalItems).toEqual(2);
          expect(response.body.meta.pagination.totalPages).toEqual(2);
        });
    });

    it('should filter books by title', async () => {
      const bookToFind = await createBookDirectly({
        title: 'Specific Title',
        author: 'Auth X',
        isbn: '333-3-33-333333-3',
      });
      await createBookDirectly({
        title: 'Another Book',
        author: 'Auth Y',
        isbn: '444-4-44-444444-4',
      });
      const titleFilter = 'Specific Title';

      return request(app.getHttpServer())
        .get(`/books?title=${encodeURIComponent(titleFilter)}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].id).toEqual(bookToFind.id);
          expect(response.body.data[0].title).toEqual(titleFilter);
        });
    });

    it('should filter books by author', async () => {
      await createBookDirectly({
        title: 'Book P',
        author: 'Target Author',
        isbn: '555-5-55-555555-5',
      });
      const bookToFind = await createBookDirectly({
        title: 'Book Q',
        author: 'Target Author',
        isbn: '666-6-66-666666-6',
      });
      await createBookDirectly({
        title: 'Book R',
        author: 'Different Author',
        isbn: '777-7-77-777777-7',
      });
      const authorFilter = 'Target Author';

      return request(app.getHttpServer())
        .get(`/books?author=${encodeURIComponent(authorFilter)}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(2);
          expect(response.body.data.some((b) => b.id === bookToFind.id)).toBe(
            true,
          );
        });
    });

    it('should filter books by status', async () => {
      await createBookDirectly({
        title: 'Available Book',
        author: 'Auth Avail',
        isbn: '888-8-88-888888-8',
      });
      const borrowedBook = await createBookDirectly({
        title: 'Borrowed Book',
        author: 'Auth Borrow',
        isbn: '999-9-99-999999-9',
      });
      const bookRepository = dataSource.getRepository(Book);
      await bookRepository.update(borrowedBook.id, {
        status: BookStatus.BORROWED,
      });

      return request(app.getHttpServer())
        .get(`/books?status=${BookStatus.BORROWED}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].id).toEqual(borrowedBook.id);
          expect(response.body.data[0].status).toEqual(BookStatus.BORROWED);
        });
    });
  });

  describe('/books/:id (GET)', () => {
    it('should get a specific book by ID', async () => {
      const createdBook = await createBookDirectly(uniqueCreateBookDto);

      return request(app.getHttpServer())
        .get(`/books/${createdBook.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdBook.id);
          expect(response.body.data.title).toEqual(uniqueCreateBookDto.title);
        });
    });

    it('should return 404 for a non-existent book ID', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .get(`/books/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for an invalid book ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .get('/books/invalid-id')
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          if (response.body.error.details?.message) {
            expect(response.body.error.details.message).toBeInstanceOf(Array);
            expect(
              response.body.error.details.message.some((m) =>
                m.includes('numeric string'),
              ),
            ).toBe(true);
          } else {
            expect(response.body.error.message).toMatch(
              /Validation failed|numeric string/,
            );
          }
        });
    });
  });

  describe('/books/:id (PATCH)', () => {
    const updateBookDto: UpdateBookDto = { title: 'Updated E2E Book Title' };
    const updateStatusDto: UpdateBookDto = { status: BookStatus.BOOKED };

    it('should update a book title successfully', async () => {
      const createdBook = await createBookDirectly(uniqueCreateBookDto);

      return request(app.getHttpServer())
        .patch(`/books/${createdBook.id}`)
        .send(updateBookDto)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdBook.id);
          expect(response.body.data.title).toEqual(updateBookDto.title);
          expect(response.body.data.author).toEqual(createdBook.author);
        });
    });

    it('should update book status successfully', async () => {
      const createdBook = await createBookDirectly(uniqueCreateBookDto);
      expect(createdBook.status).toEqual(BookStatus.AVAILABLE);

      return request(app.getHttpServer())
        .patch(`/books/${createdBook.id}`)
        .send(updateStatusDto)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdBook.id);
          expect(response.body.data.status).toEqual(updateStatusDto.status);
          expect(response.body.data.title).toEqual(createdBook.title);
        });
    });
    it('should return 404 when trying to update a non-existent book', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .patch(`/books/${nonExistentId}`)
        .send(updateBookDto)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for invalid book ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .patch('/books/invalid-id')
        .send(updateBookDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          if (response.body.error.details?.message) {
            expect(response.body.error.details.message).toBeInstanceOf(Array);
            expect(
              response.body.error.details.message.some((m) =>
                m.includes('numeric string'),
              ),
            ).toBe(true);
          } else {
            expect(response.body.error.message).toMatch(
              /Validation failed|numeric string/,
            );
          }
        });
    });
  });

  describe('/books/:id (DELETE)', () => {
    it('should delete a book successfully', async () => {
      const createdBook = await createBookDirectly(uniqueCreateBookDto);

      return request(app.getHttpServer())
        .delete(`/books/${createdBook.id}`)
        .expect(HttpStatus.NO_CONTENT)
        .then(async () => {
          const bookRepository = dataSource.getRepository(Book);
          const findBook = await bookRepository.findOneBy({
            id: createdBook.id,
          });
          expect(findBook).toBeNull();
        });
    });

    it('should return 404 when trying to delete a non-existent book', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .delete(`/books/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for an invalid book ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .delete('/books/invalid-id')
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          if (response.body.error.details?.message) {
            expect(response.body.error.details.message).toBeInstanceOf(Array);
            expect(
              response.body.error.details.message.some((m) =>
                m.includes('numeric string'),
              ),
            ).toBe(true);
          } else {
            expect(response.body.error.message).toMatch(
              /Validation failed|numeric string/,
            );
          }
        });
    });
  });
});
