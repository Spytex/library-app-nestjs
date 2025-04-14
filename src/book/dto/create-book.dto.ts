import {
  IsString,
  IsNotEmpty,
  IsISBN,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { BookStatus } from '../book.entity';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsISBN()
  @IsNotEmpty()
  isbn: string;

  @IsString()
  @IsOptional()
  description?: string;
}
