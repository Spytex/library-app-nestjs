import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../../db/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';
import { books, bookStatusEnum } from '../../db/schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FindBooksQueryDto } from './dto/find-books-query.dto';
import { eq, ilike, and, SQL } from 'drizzle-orm';

type DrizzleDB = PostgresJsDatabase<typeof schema>;
type BookSelect = typeof schema.books.$inferSelect;
type BookStatus = (typeof schema.bookStatusEnum.enumValues)[number];

@Injectable()
export class BookService {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private db: DrizzleDB,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookSelect> {
    const existingBook = await this.db
      .select()
      .from(books)
      .where(eq(books.isbn, createBookDto.isbn))
      .limit(1);

    if (existingBook.length > 0) {
      throw new ConflictException(
        `Book with ISBN "${createBookDto.isbn}" already exists.`,
      );
    }
    const [newBook] = await this.db
      .insert(books)
      .values(createBookDto)
      .returning();
    return newBook;
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<BookSelect[]> {
    const { status, title, author, limit = 10, offset = 0 } = queryDto;

    const conditions: (SQL | undefined)[] = [];
    if (status) {
      conditions.push(eq(books.status, status));
    }
    if (title) {
      conditions.push(ilike(books.title, `%${title}%`));
    }
    if (author) {
      conditions.push(ilike(books.author, `%${author}%`));
    }

    const query = this.db
      .select()
      .from(books)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    return query;
  }

  async findOne(id: number): Promise<BookSelect> {
    const [book] = await this.db.select().from(books).where(eq(books.id, id));
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async findOneByIsbn(isbn: string): Promise<BookSelect | null> {
    const [book] = await this.db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn))
      .limit(1);
    return book || null;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<BookSelect> {
    await this.findOne(id);

    if (updateBookDto.isbn) {
      const existingBook = await this.db
        .select()
        .from(books)
        .where(eq(books.isbn, updateBookDto.isbn))
        .limit(1);
      if (existingBook.length > 0 && existingBook[0].id !== id) {
        throw new ConflictException(
          `Book with ISBN "${updateBookDto.isbn}" already exists.`,
        );
      }
    }

    const [updatedBook] = await this.db
      .update(books)
      .set({ ...updateBookDto, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      throw new NotFoundException(
        `Book with ID "${id}" not found during update`,
      );
    }
    return updatedBook;
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    if (
      book.status === bookStatusEnum.enumValues[1] || // BOOKED
      book.status === bookStatusEnum.enumValues[2] // BORROWED
    ) {
      throw new ConflictException(
        `Cannot delete book with ID "${id}" because it is currently ${book.status}.`,
      );
    }

    await this.db.delete(books).where(eq(books.id, id));
  }

  async updateStatus(id: number, status: BookStatus): Promise<BookSelect> {
    await this.findOne(id);

    const [updatedBook] = await this.db
      .update(books)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      throw new NotFoundException(
        `Book with ID "${id}" not found during status update`,
      );
    }
    return updatedBook;
  }
}
