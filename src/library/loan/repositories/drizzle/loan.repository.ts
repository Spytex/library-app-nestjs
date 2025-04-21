import { Inject, Injectable } from '@nestjs/common';
import { and, count as drizzleCount, eq, lt, SQL, desc } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from 'src/database/drizzle/drizzle.module';
import * as schema from 'src/database/drizzle/schema';
import { mapToLoanDto } from '../../../../common/mappers';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import { FindLoansQueryDto } from '../../dto/find-loans-query.dto';
import { LoanDto } from '../../dto/loan.dto';
import { LoanStatus } from '../../loan.entity';
import {
  ILoanFilterCriteria,
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
    const loanWithRelations = await this.findByIdWithRelations(result[0].id, [
      'user',
      'book',
    ]);
    return loanWithRelations!;
  }

  async findAll(query: FindLoansQueryDto): Promise<LoanDto[]> {
    const { limit = 10, page = 1, userId, bookId, status, isOverdue } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (userId) conditions.push(eq(schema.loans.userId, userId));
    if (bookId) conditions.push(eq(schema.loans.bookId, bookId));
    if (status) conditions.push(eq(schema.loans.status, status));
    if (isOverdue !== undefined) {
      conditions.push(eq(schema.loans.status, LoanStatus.ACTIVE));
      conditions.push(lt(schema.loans.dueDate, new Date()));
    }

    const loans = await this.db.query.loans.findMany({
      where: and(...conditions),
      limit: limit,
      offset: offset,
      orderBy: [desc(schema.loans.createdAt)],
      with: { user: true, book: true },
    });
    return loans.map(mapToLoanDto);
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
    const result = await this.db.query.loans.findFirst({
      where: eq(schema.loans.id, id),
      with: {
        ...(relations.includes('book') && { book: true }),
        ...(relations.includes('user') && { user: true }),
      },
    });
    return result ? mapToLoanDto(result) : null;
  }

  async update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null> {
    const { user, book, ...loanData } = data;
    const result = await this.db
      .update(schema.loans)
      .set({ ...loanData, updatedAt: new Date() })
      .where(eq(schema.loans.id, id))
      .returning();

    if (result.length === 0) return null;
    const loanWithRelations = await this.findByIdWithRelations(result[0].id, [
      'user',
      'book',
    ]);
    return loanWithRelations;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.loans)
      .where(eq(schema.loans.id, id))
      .returning({ id: schema.loans.id });
    return result.length > 0;
  }

  async count(criteria?: ILoanFilterCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.userId)
      conditions.push(eq(schema.loans.userId, criteria.userId));
    if (criteria?.bookId)
      conditions.push(eq(schema.loans.bookId, criteria.bookId));
    if (criteria?.status)
      conditions.push(eq(schema.loans.status, criteria.status));
    if (criteria?.isOverdue !== undefined) {
      conditions.push(eq(schema.loans.status, LoanStatus.ACTIVE));
      conditions.push(lt(schema.loans.dueDate, new Date()));
    }

    const result = await this.db
      .select({ count: drizzleCount(schema.loans.id) })
      .from(schema.loans)
      .where(and(...conditions));
    return result[0].count;
  }
}
