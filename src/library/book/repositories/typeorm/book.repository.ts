import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Book, BookStatus } from '../../book.entity';
import { CreateBookDto } from '../../dto/create-book.dto';
import { FindBooksQueryDto } from '../../dto/find-books-query.dto';
import { UpdateBookDto } from '../../dto/update-book.dto';
import {
  IBookRepository,
  IBookCountCriteria,
} from '../book.repository.interface';
import { BookDto } from '../../dto/book.dto';
import { mapBookToDto } from '../../../../common/mappers';

@Injectable()
export class TypeOrmBookRepository implements IBookRepository {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookDto> {
    const newBook = this.bookRepository.create(createBookDto);
    const savedBook = await this.bookRepository.save(newBook);
    return mapBookToDto(savedBook);
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<BookDto[]> {
    const { limit = 10, offset = 0, title, author, status } = queryDto;
    const where: FindOptionsWhere<Book> = {};

    if (status) where.status = status;
    if (title) where.title = ILike(`%${title}%`);
    if (author) where.author = ILike(`%${author}%`);

    const books = await this.bookRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return books.map(mapBookToDto);
  }

  async findById(id: number): Promise<BookDto | null> {
    const book = await this.bookRepository.findOneBy({ id });
    return book ? mapBookToDto(book) : null;
  }

  async findByIsbn(isbn: string): Promise<BookDto | null> {
    const book = await this.bookRepository.findOneBy({ isbn });
    return book ? mapBookToDto(book) : null;
  }

  async update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookDto | null> {
    const bookToUpdate = await this.bookRepository.preload({
      id: id,
      ...updateBookDto,
    });
    if (!bookToUpdate) return null;
    const updatedBook = await this.bookRepository.save(bookToUpdate);
    return mapBookToDto(updatedBook);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.bookRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async updateStatus(id: number, status: BookStatus): Promise<BookDto | null> {
    const updateResult = await this.bookRepository.update(id, { status });
    if (updateResult.affected === 0) return null;
    return this.findById(id);
  }

  async count(criteria?: IBookCountCriteria): Promise<number> {
    const where: FindOptionsWhere<Book> = {};
    if (criteria?.status) where.status = criteria.status;
    if (criteria?.title) where.title = ILike(`%${criteria.title}%`);
    if (criteria?.author) where.author = ILike(`%${criteria.author}%`);
    if (criteria?.isbn) where.isbn = criteria.isbn;
    return this.bookRepository.count({ where });
  }
}
