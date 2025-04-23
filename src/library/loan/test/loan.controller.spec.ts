import { Test, TestingModule } from '@nestjs/testing';
import { LoanController } from '../loan.controller';
import { LoanService } from '../loan.service';
import { Loan, LoanStatus } from '../loan.entity';
import { User } from '../../../user/user.entity';
import { Book } from '../../book/book.entity';
import { Review } from '../../review/review.entity';
import { FindLoansQueryDto } from '../dto/find-loans-query.dto';

const mockLoanService = {
  createBooking: jest.fn(),
  pickupLoan: jest.fn(),
  returnLoan: jest.fn(),
  extendLoan: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findUserLoans: jest.fn(),
  findBookLoans: jest.fn(),
};

describe('LoanController', () => {
  let controller: LoanController;
  let service: typeof mockLoanService;

  const mockLoan: Loan = {
    id: 1,
    userId: 1,
    bookId: 1,
    status: LoanStatus.ACTIVE,
    loanDate: new Date(),
    dueDate: new Date(),
    returnDate: null,
    bookingDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as User,
    book: {} as Book,
    review: {} as Review,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoanController],
      providers: [
        {
          provide: LoanService,
          useValue: mockLoanService,
        },
      ],
    }).compile();

    controller = module.get<LoanController>(LoanController);
    service = module.get(LoanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return the result', async () => {
      const query: FindLoansQueryDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockLoan],
        meta: { pagination: {} as any },
      };
      service.findAll.mockResolvedValue(paginatedResult);
      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return the result', async () => {
      service.findOne.mockResolvedValue(mockLoan);
      const result = await controller.findOne(mockLoan.id);
      expect(service.findOne).toHaveBeenCalledWith(mockLoan.id);
      expect(result).toEqual(mockLoan);
    });
  });

  describe('findUserLoans', () => {
    it('should call service.findUserLoans and return the result', async () => {
      const query: FindLoansQueryDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockLoan],
        meta: { pagination: {} as any },
      };
      service.findUserLoans.mockResolvedValue(paginatedResult);
      const result = await controller.findUserLoans(1, query);
      expect(service.findUserLoans).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findBookLoans', () => {
    it('should call service.findBookLoans and return the result', async () => {
      const query: FindLoansQueryDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockLoan],
        meta: { pagination: {} as any },
      };
      service.findBookLoans.mockResolvedValue(paginatedResult);
      const result = await controller.findBookLoans(1, query);
      expect(service.findBookLoans).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(paginatedResult);
    });
  });
});
