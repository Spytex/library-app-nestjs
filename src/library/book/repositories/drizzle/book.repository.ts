import { Inject, Injectable } from '@nestjs/common';
import { and, count as drizzleCount, eq, ilike, SQL } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from 'src/database/drizzle/drizzle.module';
import * as schema from 'src/database/drizzle/schema';
import { mapToBookDto } from '../../../../common/mappers';
import { BookStatus } from '../../book.entity';
import { BookDto } from '../../dto/book.dto';
import { CreateBookDto } from '../../dto/create-book.dto';
import { FindBooksQueryDto } from '../../dto/find-books-query.dto';
import { UpdateBookDto } from '../../dto/update-book.dto';
import {
  IBookCountCriteria,
  IBookRepository,
} from '../book.repository.interface';

@Injectable()
export class DrizzleBookRepository implements IBookRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createBookDto: CreateBookDto): Promise<BookDto> {
    const result = await this.db
      .insert(schema.books)
      .values(createBookDto)
      .returning();
    return mapToBookDto(result[0]);
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<BookDto[]> {
    const { limit = 10, page = 1, title, author, status } = queryDto;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (status) conditions.push(eq(schema.books.status, status));
    if (title) conditions.push(ilike(schema.books.title, `%${title}%`));
    if (author) conditions.push(ilike(schema.books.author, `%${author}%`));

    const books = await this.db
      .select()
      .from(schema.books)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(schema.books.createdAt);

    return books.map(mapToBookDto);
  }

  async findById(id: number): Promise<BookDto | null> {
    const result = await this.db
      .select()
      .from(schema.books)
      .where(eq(schema.books.id, id))
      .limit(1);
    return result.length > 0 ? mapToBookDto(result[0]) : null;
  }

  async findByIsbn(isbn: string): Promise<BookDto | null> {
    const result = await this.db
      .select()
      .from(schema.books)
      .where(eq(schema.books.isbn, isbn))
      .limit(1);
    return result.length > 0 ? mapToBookDto(result[0]) : null;
  }

  async update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookDto | null> {
    const result = await this.db
      .update(schema.books)
      .set({ ...updateBookDto, updatedAt: new Date() })
      .where(eq(schema.books.id, id))
      .returning();
    return result.length > 0 ? mapToBookDto(result[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.books)
      .where(eq(schema.books.id, id))
      .returning({ id: schema.books.id });
    return result.length > 0;
  }

  async updateStatus(id: number, status: BookStatus): Promise<BookDto | null> {
    const result = await this.db
      .update(schema.books)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(schema.books.id, id))
      .returning();
    return result.length > 0 ? mapToBookDto(result[0]) : null;
  }

  async count(criteria?: IBookCountCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.status)
      conditions.push(eq(schema.books.status, criteria.status));
    if (criteria?.title)
      conditions.push(ilike(schema.books.title, `%${criteria.title}%`));
    if (criteria?.author)
      conditions.push(ilike(schema.books.author, `%${criteria.author}%`));
    if (criteria?.isbn) conditions.push(eq(schema.books.isbn, criteria.isbn));

    const result = await this.db
      .select({ count: drizzleCount(schema.books.id) })
      .from(schema.books)
      .where(and(...conditions));
    return result[0].count;
  }
}
