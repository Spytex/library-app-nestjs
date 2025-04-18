import { plainToInstance } from 'class-transformer';
import { BookSelect } from '../../database/drizzle/schema';
import { Book } from '../../library/book/book.entity';
import { BookDto } from '../../library/book/dto/book.dto';

type BookSource = Book | BookSelect;

export function mapToBookDto<T extends BookSource | BookSource[]>(
  source: T,
): T extends BookSource[] ? BookDto[] : BookDto {
  return plainToInstance(BookDto, source, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  }) as T extends BookSource[] ? BookDto[] : BookDto;
}
