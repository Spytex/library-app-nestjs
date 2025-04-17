import { CreateBookDto } from '../dto/create-book.dto';
import { FindBooksQueryDto } from '../dto/find-books-query.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { BookStatus } from '../book.entity';
import { BookDto } from '../dto/book.dto';

export interface IBookCountCriteria {
  status?: BookStatus;
  title?: string;
  author?: string;
  isbn?: string;
}

export interface IBookRepository {
  create(createBookDto: CreateBookDto): Promise<BookDto>;
  findAll(queryDto: FindBooksQueryDto): Promise<BookDto[]>;
  findById(id: number): Promise<BookDto | null>;
  findByIsbn(isbn: string): Promise<BookDto | null>;
  update(id: number, updateBookDto: UpdateBookDto): Promise<BookDto | null>;
  remove(id: number): Promise<boolean>;
  updateStatus(id: number, status: BookStatus): Promise<BookDto | null>;
  count(criteria?: IBookCountCriteria): Promise<number>;
}

export const BOOK_REPOSITORY = 'IBookRepository';
