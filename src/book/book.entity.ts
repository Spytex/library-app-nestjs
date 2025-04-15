import { Loan } from '../loan/loan.entity';
import { Review } from '../review/review.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BORROWED = 'BORROWED',
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  title: string;

  @Index()
  @Column()
  author: string;

  @Index({ unique: true })
  @Column({ unique: true })
  isbn: string;

  @Column('text', { nullable: true })
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.AVAILABLE,
  })
  status: BookStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Loan, (loan) => loan.book, { onDelete: 'CASCADE' })
  loans: Loan[];

  @OneToMany(() => Review, (review) => review.book, { onDelete: 'CASCADE' })
  reviews: Review[];
}
