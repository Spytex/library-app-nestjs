import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateLoanDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  bookId: number;
}
