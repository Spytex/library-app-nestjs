import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../../db/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';
import { loans, loanStatusEnum } from '../../db/schema';
import { CreateLoanDto } from './dto/create-loan.dto';
import { eq, desc } from 'drizzle-orm';

type DrizzleDB = PostgresJsDatabase<typeof schema>;
type LoanSelect = typeof schema.loans.$inferSelect;

@Injectable()
export class LoanService {
  private readonly LOAN_DURATION_DAYS = 14;
  private readonly EXTENSION_DAYS = 7;

  constructor(
    @Inject(DRIZZLE_CLIENT)
    private db: DrizzleDB,
  ) {}

  async createBooking(createLoanDto: CreateLoanDto): Promise<LoanSelect> {
    const { userId, bookId } = createLoanDto;

    const [newLoan] = await this.db
      .insert(loans)
      .values({
        userId,
        bookId,
        status: loanStatusEnum.enumValues[0], // BOOKED
        bookingDate: new Date(),
      })
      .returning();

    return newLoan;
  }

  async pickupLoan(loanId: number): Promise<LoanSelect> {
    const loan = await this.findOne(loanId);

    const loanDate = new Date();
    const dueDate = this.calculateDueDate(loanDate);

    const [updatedLoan] = await this.db
      .update(loans)
      .set({
        status: loanStatusEnum.enumValues[1], // ACTIVE
        loanDate: loanDate,
        dueDate: dueDate,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during pickup`,
      );
    }
    return updatedLoan;
  }

  async returnLoan(loanId: number): Promise<LoanSelect> {
    await this.findOne(loanId);

    const [updatedLoan] = await this.db
      .update(loans)
      .set({
        status: loanStatusEnum.enumValues[2], // RETURNED
        returnDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during return`,
      );
    }
    return updatedLoan;
  }

  async extendLoan(loanId: number): Promise<LoanSelect> {
    const loan = await this.findOne(loanId);

    if (!loan.dueDate) {
      throw new BadRequestException(
        `Loan with ID "${loanId}" has no due date set, cannot extend.`,
      );
    }

    if (loan.status === loanStatusEnum.enumValues[2]) {
      // RETURNED
      throw new BadRequestException(
        `Cannot extend a returned loan (ID: "${loanId}").`,
      );
    }

    const newDueDate = this.addDays(loan.dueDate, this.EXTENSION_DAYS);

    const [updatedLoan] = await this.db
      .update(loans)
      .set({
        dueDate: newDueDate,
        updatedAt: new Date(),
        ...(loan.status === loanStatusEnum.enumValues[3] // OVERDUE
          ? { status: loanStatusEnum.enumValues[1] } // ACTIVE
          : {}),
      })
      .where(eq(loans.id, loanId))
      .returning();

    if (!updatedLoan) {
      throw new NotFoundException(
        `Loan with ID "${loanId}" not found during extension`,
      );
    }
    return updatedLoan;
  }

  async findOne(id: number): Promise<LoanSelect> {
    const [loan] = await this.db.select().from(loans).where(eq(loans.id, id));
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async findOneWithRelations(id: number): Promise<any> {
    const loan = await this.db.query.loans.findFirst({
      where: eq(loans.id, id),
      with: {
        book: true,
        user: true,
        review: true,
      },
    });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async findUserLoans(userId: number): Promise<any[]> {
    return this.db.query.loans.findMany({
      where: eq(loans.userId, userId),
      orderBy: desc(loans.createdAt),
      with: {
        book: true,
      },
    });
  }

  async findBookLoans(bookId: number): Promise<any[]> {
    return this.db.query.loans.findMany({
      where: eq(loans.bookId, bookId),
      orderBy: desc(loans.createdAt),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  private calculateDueDate(startDate: Date): Date {
    return this.addDays(startDate, this.LOAN_DURATION_DAYS);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
