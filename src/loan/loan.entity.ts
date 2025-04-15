import { Book } from '../book/book.entity';
import { User } from '../user/user.entity';
import { Review } from '../review/review.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum LoanStatus {
  BOOKED = 'BOOKED',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => User, (user) => user.loans, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Index()
  @ManyToOne(() => Book, (book) => book.loans, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  bookId: number;

  @Column({ type: 'timestamp', nullable: true })
  bookingDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  loanDate: Date | null;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  returnDate: Date | null;

  @Index()
  @Column({
    type: 'enum',
    enum: LoanStatus,
    nullable: false,
  })
  status: LoanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Review, (review) => review.loan)
  review: Review;
}
