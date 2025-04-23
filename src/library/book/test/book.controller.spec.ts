import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from '../book.controller';
import { BookService } from '../book.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { Book, BookStatus } from '../book.entity';

const mockBookService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('BookController', () => {
  let controller: BookController;
  let service: typeof mockBookService;

  const mockBook: Book = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    isbn: '978-1234567890',
    description: 'Test Description',
    status: BookStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    loans: [],
    reviews: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: mockBookService,
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
    service = module.get(BookService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateBookDto = {
      title: 'New',
      author: 'Auth',
      isbn: '123',
      description: 'Desc',
    };
    it('should call service.create and return the result', async () => {
      const createdBook = { ...mockBook, ...createDto, id: 2 };
      service.create.mockResolvedValue(createdBook);
      const result = await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdBook);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return the result', async () => {
      service.findOne.mockResolvedValue(mockBook);
      const result = await controller.findOne(mockBook.id);
      expect(service.findOne).toHaveBeenCalledWith(mockBook.id);
      expect(result).toEqual(mockBook);
    });
  });
});
