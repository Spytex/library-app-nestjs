import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { Loan, LoanStatus } from '../../loan.entity';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import {
  ILoanRepository,
  ILoanCountCriteria,
} from '../loan.repository.interface';
import { LoanDto } from '../../dto/loan.dto';
import { UserDto } from '../../../../user/dto/user.dto';
import { BookDto } from '../../../book/dto/book.dto';

@Injectable()
export class TypeOrmLoanRepository implements ILoanRepository {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  private mapToDto(loan: Loan): LoanDto {
    const dto: LoanDto = {
      id: loan.id,
      userId: loan.userId,
      bookId: loan.bookId,
      bookingDate: loan.bookingDate,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      returnDate: loan.returnDate,
      status: loan.status,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      user: loan.user
        ? ({
            id: loan.user.id,
            name: loan.user.name,
            email: loan.user.email,
            createdAt: loan.user.createdAt,
            updatedAt: loan.user.updatedAt,
          } as UserDto)
        : undefined,
      book: loan.book
        ? ({
            id: loan.book.id,
            title: loan.book.title,
            author: loan.book.author,
            isbn: loan.book.isbn,
            description: loan.book.description,
            status: loan.book.status,
            createdAt: loan.book.createdAt,
            updatedAt: loan.book.updatedAt,
          } as BookDto)
        : undefined,
    };
    return dto;
  }

  async create(
    createLoanDto: CreateLoanDto,
    status: LoanStatus,
    bookingDate?: Date,
    loanDate?: Date,
    dueDate?: Date,
  ): Promise<LoanDto> {
    const newLoan = this.loanRepository.create({
      ...createLoanDto,
      status,
      bookingDate,
      loanDate,
      dueDate,
    });
    const savedLoan = await this.loanRepository.save(newLoan);
    return this.mapToDto(savedLoan);
  }

  async findById(id: number): Promise<LoanDto | null> {
    const loan = await this.loanRepository.findOneBy({ id });
    return loan ? this.mapToDto(loan) : null;
  }

  async findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanDto | null> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations,
    });
    return loan ? this.mapToDto(loan) : null;
  }

  async findUserLoans(userId: number): Promise<LoanDto[]> {
    const loans = await this.loanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
    return loans.map(this.mapToDto);
  }

  async findBookLoans(bookId: number): Promise<LoanDto[]> {
    const loans = await this.loanRepository.find({
      where: { bookId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return loans.map(this.mapToDto);
  }

  async update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null> {
    const { user, book, ...loanData } = data;
    const loanToUpdate = await this.loanRepository.preload({ id, ...loanData });
    if (!loanToUpdate) return null;
    const updatedLoan = await this.loanRepository.save(loanToUpdate);
    return this.mapToDto(updatedLoan);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.loanRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async count(criteria?: ILoanCountCriteria): Promise<number> {
    const where: FindOptionsWhere<Loan> = {};
    if (criteria?.userId) where.userId = criteria.userId;
    if (criteria?.bookId) where.bookId = criteria.bookId;
    if (criteria?.status) where.status = criteria.status;
    if (criteria?.isOverdue !== undefined) {
      where.status = LoanStatus.ACTIVE;
      where.dueDate = LessThan(new Date());
    }
    return this.loanRepository.count({ where });
  }
}
