import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../../db/drizzle.module';
import * as schema from '../../../../db/schema';
import { LoanStatus } from '../../loan.entity';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import {
  ILoanRepository,
  LoanRepresentation,
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
  ): Promise<LoanRepresentation> {
    const result = await this.db
      .insert(schema.loans)
      .values({
        ...createLoanDto,
        status,
        bookingDate,
        loanDate,
        dueDate,
      })
      .returning();
    return result[0];
  }

  async findById(id: number): Promise<LoanRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.loans)
      .where(eq(schema.loans.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanRepresentation | null> {
    const query = this.db.query.loans.findFirst({
      where: eq(schema.loans.id, id),
      with: {
        ...(relations.includes('book') && { book: true }),
        ...(relations.includes('user') && { user: true }),
        ...(relations.includes('review') && { review: true }),
      },
    });
    const result = await query;
    return result ?? null;
  }

  async findUserLoans(userId: number): Promise<LoanRepresentation[]> {
    return this.db.query.loans.findMany({
      where: eq(schema.loans.userId, userId),
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
      with: { book: true },
    });
  }

  async findBookLoans(bookId: number): Promise<LoanRepresentation[]> {
    return this.db.query.loans.findMany({
      where: eq(schema.loans.bookId, bookId),
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
      with: { user: true },
    });
  }

  async update(
    id: number,
    data: Partial<LoanRepresentation>,
  ): Promise<LoanRepresentation | null> {
    const result = await this.db
      .update(schema.loans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.loans.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.loans)
      .where(eq(schema.loans.id, id))
      .returning({ id: schema.loans.id });
    return result.length > 0;
  }

  async count(criteria?: any): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.loans);
    return Number(result[0].count);
  }
}
