import { plainToInstance } from 'class-transformer';
import {
  BookSelect,
  LoanSelect,
  UserSelect,
} from '../../database/drizzle/schema';
import { LoanDto } from '../../library/loan/dto/loan.dto';
import { Loan } from '../../library/loan/loan.entity';

type LoanSource =
  | Loan
  | (LoanSelect & { user?: UserSelect; book?: BookSelect });

export function mapToLoanDto<T extends LoanSource | LoanSource[]>(
  source: T,
): T extends LoanSource[] ? LoanDto[] : LoanDto {
  return plainToInstance(LoanDto, source, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  }) as T extends LoanSource[] ? LoanDto[] : LoanDto;
}
