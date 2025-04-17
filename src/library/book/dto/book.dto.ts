import { BookStatus } from '../book.entity';

export class BookDto {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description: string | null;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
}
