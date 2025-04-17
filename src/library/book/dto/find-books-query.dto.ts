import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { bookStatusEnum } from 'src/db/schema';

export class FindBooksQueryDto {
  @IsOptional()
  @IsEnum(bookStatusEnum.enumValues)
  status?: (typeof bookStatusEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
