// filepath: d:\VSCodeProjects\library-app-nestjs\src\library\book\repositories\book.repository.interface.ts
import { CreateBookDto } from '../dto/create-book.dto';
import { FindBooksQueryDto } from '../dto/find-books-query.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { Book, BookStatus } from '../book.entity';
import { BookSelect } from '../../../db/schema';

export type BookRepresentation = Book | BookSelect;

export interface IBookRepository {
  create(createBookDto: CreateBookDto): Promise<BookRepresentation>;
  findAll(queryDto: FindBooksQueryDto): Promise<BookRepresentation[]>;
  findById(id: number): Promise<BookRepresentation | null>;
  findByIsbn(isbn: string): Promise<BookRepresentation | null>;
  update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookRepresentation | null>;
  remove(id: number): Promise<boolean>;
  updateStatus(
    id: number,
    status: BookStatus,
  ): Promise<BookRepresentation | null>;
  count(criteria?: any): Promise<number>;
}

export const BOOK_REPOSITORY = 'IBookRepository';
