import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanService } from '../loan.service';
import { LoanStatus } from '../loan.entity';
import { Book } from '../../book/book.entity';
import { User } from '../../../user/user.entity';

import {
  ILoanRepository,
  LOAN_REPOSITORY,
} from '../repositories/loan.repository.interface';
import { LoanDto } from '../dto/loan.dto';
import { CreateLoanDto } from '../dto/create-loan.dto';

const mockLoanRepository: Partial<ILoanRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findByIdWithRelations: jest.fn(),
  count: jest.fn(),
};

describe('LoanService', () => {
  let service: LoanService;
  let loanRepository: ILoanRepository;

  const mockLoanDto: LoanDto = {
    id: 1,
    userId: 1,
    bookId: 1,
    status: LoanStatus.ACTIVE,
    loanDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    returnDate: null,
    bookingDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 1, name: 'Test User', email: 'test@user.com' } as User,
    book: { id: 1, title: 'Test Book', author: 'Test Author' } as Book,
  };

  const mockBookedLoanDto: LoanDto = {
    ...mockLoanDto,
    id: 2,
    bookId: 2,
    status: LoanStatus.BOOKED,
    loanDate: null,
    dueDate: null,
    bookingDate: new Date(),
    book: { id: 2, title: 'Booked Book' } as Book,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        {
          provide: LOAN_REPOSITORY,
          useValue: mockLoanRepository,
        },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    loanRepository = module.get<ILoanRepository>(LOAN_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const createDto: CreateLoanDto = { userId: 1, bookId: 1 };
    const expectedBookingResult: LoanDto = {
      ...mockLoanDto,
      id: 3,
      userId: createDto.userId,
      bookId: createDto.bookId,
      status: LoanStatus.BOOKED,
      bookingDate: expect.any(Date),
      loanDate: null,
      dueDate: null,
      returnDate: null,
      user: undefined,
      book: undefined,
    };

    it('should call repository.create with correct parameters', async () => {
      (mockLoanRepository.create as jest.Mock).mockResolvedValue(
        expectedBookingResult,
      );

      const result = await service.createBooking(createDto);

      expect(mockLoanRepository.create).toHaveBeenCalledWith(
        createDto,
        LoanStatus.BOOKED,
        expect.any(Date),
      );
      expect(result).toEqual(expectedBookingResult);
    });
  });

  describe('pickupLoan', () => {
    const loanId = mockBookedLoanDto.id;
    const expectedPickupResult: LoanDto = {
      ...mockBookedLoanDto,
      status: LoanStatus.ACTIVE,
      loanDate: expect.any(Date),
      dueDate: expect.any(Date),
    };

    it('should pickup a loan successfully', async () => {
      (mockLoanRepository.findByIdWithRelations as jest.Mock).mockResolvedValue(
        mockBookedLoanDto,
      );
      (mockLoanRepository.update as jest.Mock).mockResolvedValue(
        expectedPickupResult,
      );

      const result = await service.pickupLoan(loanId);

      expect(mockLoanRepository.findByIdWithRelations).toHaveBeenCalledWith(
        loanId,
        ['user', 'book'],
      );
      expect(mockLoanRepository.update).toHaveBeenCalledWith(loanId, {
        status: LoanStatus.ACTIVE,
        loanDate: expect.any(Date),
        dueDate: expect.any(Date),
      });
      expect(result).toEqual(expectedPickupResult);
    });

    it('should throw NotFoundException if loan not found during findOne', async () => {
      (mockLoanRepository.findByIdWithRelations as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.pickupLoan(999)).rejects.toThrow(NotFoundException);
      expect(mockLoanRepository.findByIdWithRelations).toHaveBeenCalledWith(
        999,
        ['user', 'book'],
      );
      expect(mockLoanRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if loan not found during update', async () => {
      (mockLoanRepository.findByIdWithRelations as jest.Mock).mockResolvedValue(
        mockBookedLoanDto,
      );
      (mockLoanRepository.update as jest.Mock).mockResolvedValue(null);

      await expect(service.pickupLoan(loanId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLoanRepository.findByIdWithRelations).toHaveBeenCalledWith(
        loanId,
        ['user', 'book'],
      );
      expect(mockLoanRepository.update).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a loan DTO if found', async () => {
      (mockLoanRepository.findByIdWithRelations as jest.Mock).mockResolvedValue(
        mockLoanDto,
      );
      const result = await service.findOne(mockLoanDto.id);
      expect(mockLoanRepository.findByIdWithRelations).toHaveBeenCalledWith(
        mockLoanDto.id,
        ['user', 'book'],
      );
      expect(result).toEqual(mockLoanDto);
    });

    it('should throw NotFoundException if loan not found', async () => {
      (mockLoanRepository.findByIdWithRelations as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockLoanRepository.findByIdWithRelations).toHaveBeenCalledWith(
        999,
        ['user', 'book'],
      );
    });
  });
});
