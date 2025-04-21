import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookStatus } from './book.entity';
import { BookDto } from './dto/book.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { FindBooksQueryDto } from './dto/find-books-query.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import {
  BOOK_REPOSITORY,
  IBookRepository,
} from './repositories/book.repository.interface';
import { IPaginatedResult, createPaginatedResponse } from '../../common/utils/pagination.utils';

@Injectable()
export class BookService {
  constructor(
    @Inject(BOOK_REPOSITORY)
    protected readonly bookRepository: IBookRepository,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookDto> {
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
  
  async findAll(query: FindBooksQueryDto): Promise<IPaginatedResult<BookDto>> {
    const { page = 1, limit = 10, ...filters } = query;

    const items = await this.bookRepository.findAll(query);
    const totalItems = await this.bookRepository.count(filters as any);

    return createPaginatedResponse<BookDto>(items, totalItems, page, limit);
  }
  
  async findOne(id: number): Promise<BookDto> {
    const item = await this.bookRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return item;
  }
  
  async update(id: number, updateDto: UpdateBookDto): Promise<BookDto> {
    const updatedItem = await this.bookRepository.update(id, updateDto);
    if (!updatedItem) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return updatedItem;
  }

  async findOneByIsbn(isbn: string): Promise<BookDto | null> {
    return this.bookRepository.findByIsbn(isbn);
  }

  async updateStatus(id: number, status: BookStatus): Promise<BookDto> {
    const updatedBook = await this.bookRepository.updateStatus(id, status);
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
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
  }
  
  async count(filters: Partial<Omit<FindBooksQueryDto, 'page' | 'limit'>>): Promise<number> {
    return this.bookRepository.count(filters);
  }
}
