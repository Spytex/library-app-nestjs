import { Expose, Type } from 'class-transformer';
import { BookStatus } from '../book.entity';

export class BookDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  author: string;

  @Expose()
  isbn: string;

  @Expose()
  description: string | null;

  @Expose()
  status: BookStatus;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
