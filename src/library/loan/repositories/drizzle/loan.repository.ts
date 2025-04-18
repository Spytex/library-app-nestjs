import { Inject, Injectable } from '@nestjs/common';
import { and, count as drizzleCount, eq, lt, SQL } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from 'src/database/drizzle/drizzle.module';
import * as schema from 'src/database/drizzle/schema';
import { mapToLoanDto } from '../../../../common/mappers';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import { LoanDto } from '../../dto/loan.dto';
import { LoanStatus } from '../../loan.entity';
import {
  ILoanCountCriteria,
  ILoanRepository,
} from '../loan.repository.interface';

@Injectable()
export class DrizzleLoanRepository implements ILoanRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(
    createLoanDto: CreateLoanDto,
    status: LoanStatus,
    bookingDate?: Date,
    loanDate?: Date,
    dueDate?: Date,
  ): Promise<LoanDto> {
    const result = await this.db
      .insert(schema.loans)
      .values({ ...createLoanDto, status, bookingDate, loanDate, dueDate })
      .returning();
    return mapToLoanDto(result[0]);
  }

  async findById(id: number): Promise<LoanDto | null> {
    const result = await this.db
      .select()
      .from(schema.loans)
      .where(eq(schema.loans.id, id))
      .limit(1);
    return result.length > 0 ? mapToLoanDto(result[0]) : null;
  }

  async findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanDto | null> {
    const query = this.db.query.loans.findFirst({
      where: eq(schema.loans.id, id),
      with: {
        ...(relations.includes('book') && { book: true }),
        ...(relations.includes('user') && { user: true }),
      },
    });
    const result = await query;
    return result ? mapToLoanDto(result) : null;
  }

  async findUserLoans(userId: number): Promise<LoanDto[]> {
    const loans = await this.db.query.loans.findMany({
      where: eq(schema.loans.userId, userId),
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
      with: { book: true },
    });
    return loans.map(mapToLoanDto);
  }

  async findBookLoans(bookId: number): Promise<LoanDto[]> {
    const loans = await this.db.query.loans.findMany({
      where: eq(schema.loans.bookId, bookId),
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
      with: { user: true },
    });
    return loans.map(mapToLoanDto);
  }

  async update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null> {
    const { user, book, ...loanData } = data;
    const result = await this.db
      .update(schema.loans)
      .set({ ...loanData, updatedAt: new Date() })
      .where(eq(schema.loans.id, id))
      .returning();
    return result.length > 0 ? mapToLoanDto(result[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.loans)
      .where(eq(schema.loans.id, id))
      .returning({ id: schema.loans.id });
    return result.length > 0;
  }

  async count(criteria?: ILoanCountCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.userId)
      conditions.push(eq(schema.loans.userId, criteria.userId));
    if (criteria?.bookId)
      conditions.push(eq(schema.loans.bookId, criteria.bookId));
    if (criteria?.status)
      conditions.push(eq(schema.loans.status, criteria.status));
    if (criteria?.isOverdue !== undefined) {
      conditions.push(eq(schema.loans.status, LoanStatus.ACTIVE));
      if (schema.loans.dueDate) {
        conditions.push(lt(schema.loans.dueDate, new Date()));
      }
    }

    const result = await this.db
      .select({ count: drizzleCount(schema.loans.id) })
      .from(schema.loans)
      .where(and(...conditions));
    return result[0].count;
  }
}
