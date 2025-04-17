import { BookSelect } from 'src/database/drizzle/schema';
import { Book, BookStatus } from '../../library/book/book.entity';
import { BookDto } from '../../library/book/dto/book.dto';

export function mapBookToDto(book: Book): BookDto {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description,
    status: book.status,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

export function mapDrizzleBookToDto(book: BookSelect): BookDto {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description ?? null,
    status: book.status as BookStatus,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}
