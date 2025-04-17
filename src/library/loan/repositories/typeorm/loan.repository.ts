import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Loan, LoanStatus } from '../../loan.entity';
import { CreateLoanDto } from '../../dto/create-loan.dto';
import {
  ILoanRepository,
  LoanRepresentation,
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
  ): Promise<Loan> {
    const newLoan = this.loanRepository.create({
      ...createLoanDto,
      status,
      bookingDate,
      loanDate,
      dueDate,
    });
    return this.loanRepository.save(newLoan);
  }

  async findById(id: number): Promise<Loan | null> {
    return this.loanRepository.findOneBy({ id });
  }

  async findByIdWithRelations(
    id: number,
    relations: string[],
  ): Promise<Loan | null> {
    return this.loanRepository.findOne({ where: { id }, relations });
  }

  async findUserLoans(userId: number): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['book'],
    });
  }

  async findBookLoans(bookId: number): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { bookId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async update(
    id: number,
    data: Partial<LoanRepresentation>,
  ): Promise<Loan | null> {
    const loanToUpdate = await this.loanRepository.preload({
      id,
      ...data,
    } as any);
    if (!loanToUpdate) {
      return null;
    }
    return this.loanRepository.save(loanToUpdate);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.loanRepository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }

  async count(criteria?: FindOptionsWhere<Loan>): Promise<number> {
    return this.loanRepository.count({ where: criteria });
  }
}
