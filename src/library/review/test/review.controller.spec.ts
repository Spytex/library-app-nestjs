import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from '../review.controller';
import { ReviewService } from '../review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { Review } from '../review.entity';
import { User } from '../../../user/user.entity';
import { Book } from '../../book/book.entity';

const mockReviewService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findReviewsByUserId: jest.fn(),
  findReviewsByBookId: jest.fn(),
};

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: typeof mockReviewService;

  const mockReview: Review = {
    id: 1,
    userId: 1,
    bookId: 1,
    loanId: null,
    rating: 5,
    comment: 'Great!',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as User,
    book: {} as Book,
    loan: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: ReviewService,
          useValue: mockReviewService,
        },
      ],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
    service = module.get(ReviewService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateReviewDto = { userId: 1, bookId: 1, rating: 4 };
    it('should call service.create and return the result', async () => {
      const createdReview = { ...mockReview, ...createDto, id: 2 };
      service.create.mockResolvedValue(createdReview);
      const result = await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdReview);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return the result', async () => {
      service.findOne.mockResolvedValue(mockReview);
      const result = await controller.findOne(mockReview.id);
      expect(service.findOne).toHaveBeenCalledWith(mockReview.id);
      expect(result).toEqual(mockReview);
    });
  });
});
