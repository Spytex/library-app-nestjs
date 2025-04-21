import { IsEnum, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LoanStatus } from '../loan.entity';
import { Type } from 'class-transformer';

export class FindLoansQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  bookId?: number;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOverdue?: boolean;
}
