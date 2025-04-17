import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Book, BookStatus } from '../../book.entity';
import { CreateBookDto } from '../../dto/create-book.dto';
import { FindBooksQueryDto } from '../../dto/find-books-query.dto';
import { UpdateBookDto } from '../../dto/update-book.dto';
import { IBookRepository } from '../book.repository.interface';

@Injectable()
export class TypeOrmBookRepository implements IBookRepository {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const newBook = this.bookRepository.create(createBookDto);
    return this.bookRepository.save(newBook);
  }

  async findAll(queryDto: FindBooksQueryDto): Promise<Book[]> {
    const { limit = 10, offset = 0, title, author, status } = queryDto;
    const where: FindOptionsWhere<Book> = {};

    if (status) {
      where.status = status;
    }
    if (title) {
      where.title = ILike(`%${title}%`);
    }
    if (author) {
      where.author = ILike(`%${author}%`);
    }

    return this.bookRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Book | null> {
    return this.bookRepository.findOneBy({ id });
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.bookRepository.findOneBy({ isbn });
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book | null> {
    const bookToUpdate = await this.bookRepository.preload({
      id: id,
      ...updateBookDto,
    });
    if (!bookToUpdate) {
      return null;
    }
    return this.bookRepository.save(bookToUpdate);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.bookRepository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }

  async updateStatus(id: number, status: BookStatus): Promise<Book | null> {
    const updateResult = await this.bookRepository.update(id, { status });
    if (updateResult.affected === 0) {
      return null;
    }
    return this.findById(id);
  }

  async count(criteria?: FindOptionsWhere<Book>): Promise<number> {
    return this.bookRepository.count({ where: criteria });
  }
}
