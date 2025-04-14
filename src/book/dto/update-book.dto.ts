import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BookStatus } from '../book.entity';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}
