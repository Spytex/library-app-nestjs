import {
  IsString,
  IsNotEmpty,
  IsISBN,
  IsOptional,
  MinLength,
} from 'class-validator';

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
