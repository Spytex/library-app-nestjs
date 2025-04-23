import { Test, TestingModule } from '@nestjs/testing';
import { LibraryController } from '../library.controller';
import { LibraryService } from '../library.service';
import { CreateLoanDto } from '../loan/dto/create-loan.dto';
import { Loan, LoanStatus } from '../loan/loan.entity';
import { Book, BookStatus } from '../book/book.entity';
import { User } from '../../user/user.entity';
import { Review } from '../review/review.entity';

// Rename bookLoan to createBooking to match the service method
const mockLibraryService = {
  createBooking: jest.fn(),
  pickupLoan: jest.fn(),
  returnLoan: jest.fn(),
  // Add other methods used by the controller if any
  getUserLoans: jest.fn(),
  getUserReviews: jest.fn(),
  getBookLoans: jest.fn(),
  getBookReviews: jest.fn(),
  createReview: jest.fn(),
};

describe('LibraryController', () => {
  let controller: LibraryController;
  let service: typeof mockLibraryService;

  const mockUser: User = { id: 1 } as User;
  const mockBook: Book = { id: 1, status: BookStatus.AVAILABLE } as Book;
  const mockLoan: Loan = {
    id: 1,
    userId: 1,
    bookId: 1,
    status: LoanStatus.BOOKED,
    bookingDate: new Date(),
    loanDate: null, // Add missing properties
    dueDate: null,
    returnDate: null,
    user: mockUser,
    book: mockBook,
    review: {} as Review, // Add missing review property
    createdAt: new Date(), // Add missing date properties
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryController],
      providers: [
        {
          provide: LibraryService,
          useValue: mockLibraryService,
        },
      ],
    }).compile();

    controller = module.get<LibraryController>(LibraryController);
    service = module.get(LibraryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Rename describe block and method calls to createBooking
  describe('createBooking', () => {
    const createDto: CreateLoanDto = { userId: 1, bookId: 1 };
    it('should call service.createBooking and return the result', async () => {
      const bookedLoan = {
        ...mockLoan,
        status: LoanStatus.BOOKED,
        book: { ...mockBook, status: BookStatus.BOOKED },
      };
      // Use the correct mock service method name
      service.createBooking.mockResolvedValue(bookedLoan);
      // Use the correct controller method name
      const result = await controller.createBooking(createDto);
      // Expect the correct service method to have been called
      expect(service.createBooking).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(bookedLoan);
    });
  });

  describe('pickupLoan', () => {
    it('should call service.pickupLoan and return the result', async () => {
      const activeLoan = {
        ...mockLoan,
        status: LoanStatus.ACTIVE,
        loanDate: new Date(),
        dueDate: new Date(),
        book: { ...mockBook, status: BookStatus.BORROWED },
      };
      service.pickupLoan.mockResolvedValue(activeLoan);
      const result = await controller.pickupLoan(mockLoan.id);
      expect(service.pickupLoan).toHaveBeenCalledWith(mockLoan.id);
      expect(result).toEqual(activeLoan);
    });
  });

  describe('returnLoan', () => {
    it('should call service.returnLoan and return the result', async () => {
      const returnedLoan = {
        ...mockLoan,
        status: LoanStatus.RETURNED,
        returnDate: new Date(),
        book: { ...mockBook, status: BookStatus.AVAILABLE },
      };
      service.returnLoan.mockResolvedValue(returnedLoan);
      const result = await controller.returnLoan(mockLoan.id);
      expect(service.returnLoan).toHaveBeenCalledWith(mockLoan.id);
      expect(result).toEqual(returnedLoan);
    });
  });

  // Add tests for getUserLoans, getUserReviews, getBookLoans, getBookReviews, createReview
});
