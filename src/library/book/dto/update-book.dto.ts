import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { bookStatusEnum } from 'src/db/schema';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @IsOptional()
  @IsEnum(bookStatusEnum.enumValues)
  status?: (typeof bookStatusEnum.enumValues)[number];
}
