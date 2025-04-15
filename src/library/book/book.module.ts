import { forwardRef, Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { LoanModule } from 'src/library/loan/loan.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), forwardRef(() => LoanModule)],
  providers: [BookService],
  controllers: [BookController],
  exports: [BookService],
})
export class BookModule {}
