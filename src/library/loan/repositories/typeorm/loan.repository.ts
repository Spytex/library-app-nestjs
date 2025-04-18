import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { mapToLoanDto } from '../../../../common/mappers';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import { LoanDto } from '../../dto/loan.dto';
import { Loan, LoanStatus } from '../../loan.entity';
import {
  ILoanCountCriteria,
  ILoanRepository,
} from '../loan.repository.interface';

@Injectable()
export class TypeOrmLoanRepository implements ILoanRepository {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

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
    return mapToLoanDto(savedLoan);
  }

  async findById(id: number): Promise<LoanDto | null> {
    const loan = await this.loanRepository.findOneBy({ id });
    return loan ? mapToLoanDto(loan) : null;
  }

  async findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<LoanDto | null> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations,
    });
    return loan ? mapToLoanDto(loan) : null;
  }

  async findUserLoans(userId: number): Promise<LoanDto[]> {
    const loans = await this.loanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
    return loans.map(mapToLoanDto);
  }

  async findBookLoans(bookId: number): Promise<LoanDto[]> {
    const loans = await this.loanRepository.find({
      where: { bookId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return loans.map(mapToLoanDto);
  }

  async update(id: number, data: Partial<LoanDto>): Promise<LoanDto | null> {
    const { user, book, ...loanData } = data;
    const loanToUpdate = await this.loanRepository.preload({ id, ...loanData });
    if (!loanToUpdate) return null;
    const updatedLoan = await this.loanRepository.save(loanToUpdate);
    return mapToLoanDto(updatedLoan);
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
