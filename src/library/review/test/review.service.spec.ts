import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReviewService } from '../review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../repositories/review.repository.interface';
import { ReviewDto } from '../dto/review.dto';

const mockReviewRepository: Partial<IReviewRepository> = {
  findUserReviewForBook: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  remove: jest.fn(),
};

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: IReviewRepository;

  const mockReviewDto: ReviewDto = {
    id: 1,
    userId: 1,
    bookId: 1,
    loanId: null,
    rating: 5,
    comment: 'Great!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: REVIEW_REPOSITORY,
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get<IReviewRepository>(REVIEW_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateReviewDto = { userId: 1, bookId: 1, rating: 4 };
    const createdReviewDto: ReviewDto = {
      id: 2,
      userId: createDto.userId,
      bookId: createDto.bookId,
      rating: createDto.rating,
      loanId: null,
      comment: createDto.comment || null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };

    it('should create a review successfully', async () => {
      (reviewRepository.findUserReviewForBook as jest.Mock).mockResolvedValue(
        null,
      );
      (reviewRepository.create as jest.Mock).mockResolvedValue(
        createdReviewDto,
      );

      const result = await service.create(createDto);

      expect(reviewRepository.findUserReviewForBook).toHaveBeenCalledWith(
        createDto.userId,
        createDto.bookId,
      );
      expect(reviewRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdReviewDto);
    });

    it('should throw ConflictException if review already exists', async () => {
      (reviewRepository.findUserReviewForBook as jest.Mock).mockResolvedValue(
        mockReviewDto,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(reviewRepository.findUserReviewForBook).toHaveBeenCalledWith(
        createDto.userId,
        createDto.bookId,
      );
      expect(reviewRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a review if found', async () => {
      (reviewRepository.findById as jest.Mock).mockResolvedValue(mockReviewDto);
      const result = await service.findOne(mockReviewDto.id);
      expect(reviewRepository.findById).toHaveBeenCalledWith(mockReviewDto.id);
      expect(result).toEqual(mockReviewDto);
    });

    it('should throw NotFoundException if review not found', async () => {
      (reviewRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(reviewRepository.findById).toHaveBeenCalledWith(999);
    });
  });
});
