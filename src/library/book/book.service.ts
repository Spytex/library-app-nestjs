import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, FindOptionsWhere } from 'typeorm';
import { Book, BookStatus } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FindBooksQueryDto } from './dto/find-books-query.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const existingBook = await this.bookRepository.findOneBy({
      isbn: createBookDto.isbn,
    });
    if (existingBook) {
      throw new NotFoundException(
        `Book with ISBN "${createBookDto.isbn}" already exists.`,
      );
    }
    const newBook = this.bookRepository.create(createBookDto);
    return this.bookRepository.save(newBook);
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<Book[]> {
    const { status, title, author, limit, offset } = queryDto;

    const whereClause: FindOptionsWhere<Book> = {};

    if (status) {
      whereClause.status = status;
    }
    if (title) {
      whereClause.title = Like(`%${title}%`);
    }
    if (author) {
      whereClause.author = Like(`%${author}%`);
    }

    const findOptions: FindManyOptions<Book> = {
      where: whereClause,
      take: limit || 10,
      skip: offset || 0,
    };

    return this.bookRepository.find(findOptions);
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOneBy({ id });
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async findOneByIsbn(isbn: string): Promise<Book | null> {
    return this.bookRepository.findOneBy({ isbn });
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    if (updateBookDto.isbn) {
      const existingBook = await this.bookRepository.findOneBy({
        isbn: updateBookDto.isbn,
      });
      if (existingBook && existingBook.id !== id) {
        throw new NotFoundException(
          `Book with ISBN "${updateBookDto.isbn}" already exists.`,
        );
      }
    }

    const book = await this.bookRepository.preload({
      id: id,
      ...updateBookDto,
    });
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return this.bookRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    if (
      book.status === BookStatus.BORROWED ||
      book.status === BookStatus.BOOKED
    ) {
      throw new NotFoundException(
        `Cannot delete book with ID "${id}" because it is currently ${book.status}.`,
      );
    }

    const result = await this.bookRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
  }

  async updateStatus(id: number, status: BookStatus): Promise<Book> {
    const book = await this.findOne(id);
    book.status = status;
    return this.bookRepository.save(book);
  }
}
