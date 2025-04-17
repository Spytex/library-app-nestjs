import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../../db/drizzle.module';
import * as schema from '../../../../db/schema';
import { BookStatus } from '../../book.entity';
import { CreateBookDto } from '../../dto/create-book.dto';
import { FindBooksQueryDto } from '../../dto/find-books-query.dto';
import { UpdateBookDto } from '../../dto/update-book.dto';
import {
  IBookRepository,
  BookRepresentation,
} from '../book.repository.interface';

@Injectable()
export class DrizzleBookRepository implements IBookRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createBookDto: CreateBookDto): Promise<BookRepresentation> {
    const result = await this.db
      .insert(schema.books)
      .values(createBookDto)
      .returning();
    return result[0];
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<BookRepresentation[]> {
    const { limit = 10, offset = 0, title, author, status } = queryDto;
    const conditions: any[] = [];

    if (status) {
      conditions.push(eq(schema.books.status, status));
    }
    if (title) {
      conditions.push(ilike(schema.books.title, `%${title}%`));
    }
    if (author) {
      conditions.push(ilike(schema.books.author, `%${author}%`));
    }

    const query = this.db
      .select()
      .from(schema.books)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(schema.books.createdAt);

    return query;
  }

  async findById(id: number): Promise<BookRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.books)
      .where(eq(schema.books.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async findByIsbn(isbn: string): Promise<BookRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.books)
      .where(eq(schema.books.isbn, isbn))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookRepresentation | null> {
    const result = await this.db
      .update(schema.books)
      .set({ ...updateBookDto, updatedAt: new Date() })
      .where(eq(schema.books.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.books)
      .where(eq(schema.books.id, id))
      .returning({ id: schema.books.id });
    return result.length > 0;
  }

  async updateStatus(
    id: number,
    status: BookStatus,
  ): Promise<BookRepresentation | null> {
    const result = await this.db
      .update(schema.books)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(schema.books.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  async count(criteria?: any): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.books);
    return Number(result[0].count);
  }
}
