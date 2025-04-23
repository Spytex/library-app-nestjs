import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LibraryService } from '../library.service';
import { Loan, LoanStatus } from '../loan/loan.entity';
import { Book, BookStatus } from '../book/book.entity';
import { User } from '../../user/user.entity';
import { CreateLoanDto } from '../loan/dto/create-loan.dto';
import { LoanService } from '../loan/loan.service'; // Import dependent services
import { BookService } from '../book/book.service';
import { UserService } from '../../user/user.service';
import { ReviewService } from '../review/review.service'; // Import ReviewService if used

// Mocks for dependent services
const mockUserService = {
  findOne: jest.fn(),
};

const mockBookService = {
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};

const mockLoanService = {
  createBooking: jest.fn(),
  pickupLoan: jest.fn(),
  returnLoan: jest.fn(),
  findOne: jest.fn(),
};

// Mock ReviewService if LibraryService depends on it
const mockReviewService = {
  // Add methods used by LibraryService if any
};

describe('LibraryService', () => {
  let service: LibraryService;
  // Keep repository mocks if LibraryService uses them directly (unlikely if using service layer)
  // let loanRepository: MockRepository<Loan>;
  // let bookRepository: MockRepository<Book>;
  // let userRepository: MockRepository<User>;
  let userService: typeof mockUserService;
  let bookService: typeof mockBookService;
  let loanService: typeof mockLoanService;

  const mockUser: User = {
    id: 1,
    name: 'Test',
    email: 'test@test.com',
  } as User; // Cast is okay for mocks if properties aren't used directly
  const mockBookAvailable: Book = {
    id: 1,
    title: 'Available',
    status: BookStatus.AVAILABLE,
  } as Book;
  const mockBookBooked: Book = {
    id: 2,
    title: 'Booked',
    status: BookStatus.BOOKED,
  } as Book;
  const mockBookBorrowed: Book = {
    id: 3,
    title: 'Borrowed',
    status: BookStatus.BORROWED,
  } as Book;
  // Add book property to mock loans
  const mockLoanBooked: Loan = {
    id: 1,
    userId: 1,
    bookId: 2,
    status: LoanStatus.BOOKED,
    book: mockBookBooked, // Include book relation
  } as Loan;
  const mockLoanActive: Loan = {
    id: 2,
    userId: 1,
    bookId: 3,
    status: LoanStatus.ACTIVE,
    book: mockBookBorrowed, // Include book relation
  } as Loan;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibraryService,
        // Provide mocks for services instead of repositories
        { provide: UserService, useValue: mockUserService },
        { provide: BookService, useValue: mockBookService },
        { provide: LoanService, useValue: mockLoanService },
        { provide: ReviewService, useValue: mockReviewService }, // Provide ReviewService mock if needed
        // Remove repository mocks if LibraryService doesn't use them directly
        // { provide: getRepositoryToken(Loan), useValue: createMockRepository<Loan>() },
        // { provide: getRepositoryToken(Book), useValue: createMockRepository<Book>() },
        // { provide: getRepositoryToken(User), useValue: createMockRepository<User>() },
      ],
    }).compile();

    service = module.get<LibraryService>(LibraryService);
    userService = module.get(UserService);
    bookService = module.get(BookService);
    loanService = module.get(LoanService);
    // Get repository mocks if still needed
    // loanRepository = module.get<MockRepository<Loan>>(getRepositoryToken(Loan));
    // bookRepository = module.get<MockRepository<Book>>(getRepositoryToken(Book));
    // userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Rename describe block and method calls to createBooking
  describe('createBooking', () => {
    const createLoanDto: CreateLoanDto = { userId: 1, bookId: 1 };

    it('should book an available book successfully', async () => {
      // Mock service methods
      userService.findOne.mockResolvedValue(mockUser);
      bookService.findOne.mockResolvedValue(mockBookAvailable);
      // Mock loanService.createBooking to return the booked loan with the book relation
      const bookedLoanResult = {
        ...mockLoanBooked,
        bookId: mockBookAvailable.id,
        book: { ...mockBookAvailable, status: BookStatus.BOOKED },
      };
      loanService.createBooking.mockResolvedValue(bookedLoanResult);
      bookService.updateStatus.mockResolvedValue({
        ...mockBookAvailable,
        status: BookStatus.BOOKED,
      }); // Mock book status update

      // Call the correct service method: createBooking
      const result = await service.createBooking(createLoanDto);

      expect(userService.findOne).toHaveBeenCalledWith(createLoanDto.userId);
      expect(bookService.findOne).toHaveBeenCalledWith(createLoanDto.bookId);
      expect(loanService.createBooking).toHaveBeenCalledWith(createLoanDto);
      expect(bookService.updateStatus).toHaveBeenCalledWith(
        createLoanDto.bookId,
        BookStatus.BOOKED,
      );
      expect(result).toEqual(bookedLoanResult);
      // Check the status within the result object
      expect(result.status).toEqual(LoanStatus.BOOKED);
      // Check the book status within the result object's book property
      expect(result.book?.status).toEqual(BookStatus.BOOKED);
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findOne.mockRejectedValue(new NotFoundException()); // Mock user service rejection
      await expect(service.createBooking(createLoanDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findOne).toHaveBeenCalledWith(createLoanDto.userId);
      expect(bookService.findOne).not.toHaveBeenCalled(); // Ensure book service is not called
    });

    it('should throw NotFoundException if book not found', async () => {
      userService.findOne.mockResolvedValue(mockUser);
      bookService.findOne.mockRejectedValue(new NotFoundException()); // Mock book service rejection
      await expect(service.createBooking(createLoanDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findOne).toHaveBeenCalledWith(createLoanDto.userId);
      expect(bookService.findOne).toHaveBeenCalledWith(createLoanDto.bookId);
      expect(loanService.createBooking).not.toHaveBeenCalled(); // Ensure loan service is not called
    });

    it('should throw ConflictException if book is not available', async () => {
      userService.findOne.mockResolvedValue(mockUser);
      bookService.findOne.mockResolvedValue(mockBookBooked); // Return a booked book
      await expect(
        service.createBooking({ userId: 1, bookId: 2 }),
      ).rejects.toThrow(ConflictException);
      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(bookService.findOne).toHaveBeenCalledWith(2);
      expect(loanService.createBooking).not.toHaveBeenCalled(); // Ensure loan service is not called
    });
  });

  describe('pickupLoan', () => {
    it('should pickup a booked loan successfully', async () => {
      // Mock loanService.findOne to return the booked loan with book relation
      loanService.findOne.mockResolvedValue(mockLoanBooked);
      // Mock loanService.pickupLoan to return the updated loan (ACTIVE) with book relation
      const activeLoanResult = {
        ...mockLoanBooked,
        status: LoanStatus.ACTIVE,
        book: { ...mockBookBooked, status: BookStatus.BORROWED },
      };
      loanService.pickupLoan.mockResolvedValue(activeLoanResult);
      bookService.updateStatus.mockResolvedValue({
        ...mockBookBooked,
        status: BookStatus.BORROWED,
      }); // Mock book status update

      const result = await service.pickupLoan(mockLoanBooked.id);

      expect(loanService.findOne).toHaveBeenCalledWith(mockLoanBooked.id);
      expect(loanService.pickupLoan).toHaveBeenCalledWith(mockLoanBooked.id);
      expect(bookService.updateStatus).toHaveBeenCalledWith(
        mockLoanBooked.bookId,
        BookStatus.BORROWED,
      );
      expect(result).toEqual(activeLoanResult);
      expect(result.status).toEqual(LoanStatus.ACTIVE);
      // Check the book status within the result object's book property
      expect(result.book?.status).toEqual(BookStatus.BORROWED);
    });

    it('should throw NotFoundException if loan not found', async () => {
      loanService.findOne.mockRejectedValue(new NotFoundException()); // Mock loan service rejection
      await expect(service.pickupLoan(999)).rejects.toThrow(NotFoundException);
      expect(loanService.findOne).toHaveBeenCalledWith(999);
      expect(loanService.pickupLoan).not.toHaveBeenCalled(); // Ensure pickup is not called
    });

    it('should throw BadRequestException if loan is not booked', async () => {
      loanService.findOne.mockResolvedValue(mockLoanActive); // Return an active loan
      await expect(service.pickupLoan(mockLoanActive.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(loanService.findOne).toHaveBeenCalledWith(mockLoanActive.id);
      expect(loanService.pickupLoan).not.toHaveBeenCalled(); // Ensure pickup is not called
    });
  });

  // Add tests for returnLoan
});
