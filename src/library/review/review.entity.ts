import { Book } from '../book/book.entity';
import { Loan } from '../loan/loan.entity';
import { User } from '../user/user.entity';
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

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => User, (user) => user.reviews, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Index()
  @ManyToOne(() => Book, (book) => book.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  bookId: number;

  @Index()
  @OneToOne(() => Loan, (loan) => loan.review, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan | null;

  @Column({ nullable: true })
  loanId: number | null;

  @Index()
  @Column('int')
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
