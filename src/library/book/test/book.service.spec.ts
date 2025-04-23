import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BookService } from '../book.service';
import { BookStatus } from '../book.entity';
import { CreateBookDto } from '../dto/create-book.dto';
import { BookDto } from '../dto/book.dto';
import {
  IBookRepository,
  BOOK_REPOSITORY,
} from '../repositories/book.repository.interface';

const mockBookRepository: Partial<IBookRepository> = {
  findByIsbn: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

describe('BookService', () => {
  let service: BookService;
  let bookRepository: IBookRepository;

  const mockBookDto: BookDto = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    isbn: '978-1234567890',
    description: 'Test Description',
    status: BookStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: BOOK_REPOSITORY,
          useValue: mockBookRepository,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    bookRepository = module.get<IBookRepository>(BOOK_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateBookDto = {
      title: 'New Book',
      author: 'New Author',
      isbn: '978-0987654321',
      description: 'New Desc',
    };
    const createdBookDto: BookDto = {
      id: 2,
      title: createDto.title,
      author: createDto.author,
      isbn: createDto.isbn,
      description: createDto.description ?? null,
      status: BookStatus.AVAILABLE,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };

    it('should create a book successfully', async () => {
      (bookRepository.findByIsbn as jest.Mock).mockResolvedValue(null);
      (bookRepository.create as jest.Mock).mockResolvedValue(createdBookDto);

      const result = await service.create(createDto);

      expect(bookRepository.findByIsbn).toHaveBeenCalledWith(createDto.isbn);
      expect(bookRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdBookDto);
    });

    it('should throw ConflictException if ISBN already exists', async () => {
      (bookRepository.findByIsbn as jest.Mock).mockResolvedValue(mockBookDto);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(bookRepository.findByIsbn).toHaveBeenCalledWith(createDto.isbn);
      expect(bookRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a book DTO if found', async () => {
      (bookRepository.findById as jest.Mock).mockResolvedValue(mockBookDto);
      const result = await service.findOne(mockBookDto.id);
      expect(bookRepository.findById).toHaveBeenCalledWith(mockBookDto.id);
      expect(result).toEqual(mockBookDto);
    });

    it('should throw NotFoundException if book not found', async () => {
      (bookRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(bookRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  // Add more tests for findAll, update, remove, updateStatus as needed
});
