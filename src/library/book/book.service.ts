import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { BookStatus } from './book.entity'; // Keep enum
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FindBooksQueryDto } from './dto/find-books-query.dto';
import {
  IBookRepository,
  BOOK_REPOSITORY,
  BookRepresentation,
} from './repositories/book.repository.interface';

@Injectable()
export class BookService {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: IBookRepository,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookRepresentation> {
    const existingBook = await this.bookRepository.findByIsbn(
      createBookDto.isbn,
    );
    if (existingBook) {
      throw new ConflictException(
        `Book with ISBN "${createBookDto.isbn}" already exists.`,
      );
    }
    return this.bookRepository.create(createBookDto);
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<BookRepresentation[]> {
    return this.bookRepository.findAll(queryDto);
  }

  async findOne(id: number): Promise<BookRepresentation> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async findOneByIsbn(isbn: string): Promise<BookRepresentation | null> {
    return this.bookRepository.findByIsbn(isbn);
  }

  async update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookRepresentation> {
    if (updateBookDto.isbn) {
      const existingBook = await this.bookRepository.findByIsbn(
        updateBookDto.isbn,
      );
      if (existingBook && existingBook.id !== id) {
        throw new ConflictException(
          `Book with ISBN "${updateBookDto.isbn}" already exists.`,
        );
      }
    }

    const updatedBook = await this.bookRepository.update(id, updateBookDto);
    if (!updatedBook) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return updatedBook;
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    if (
      book.status === BookStatus.BORROWED ||
      book.status === BookStatus.BOOKED
    ) {
      throw new ConflictException(
        `Cannot delete book with ID "${id}" because it is currently ${book.status}.`,
      );
    }

    const deleted = await this.bookRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(
        `Book with ID "${id}" not found or could not be deleted.`,
      );
    }
  }

  async updateStatus(
    id: number,
    status: BookStatus,
  ): Promise<BookRepresentation> {
    const updatedBook = await this.bookRepository.updateStatus(id, status);
    if (!updatedBook) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return updatedBook;
  }
}
