import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../user.entity';

const mockUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: typeof mockUserService;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    loans: [],
    reviews: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateUserDto = { name: 'New', email: 'new@test.com' };
    it('should call service.create and return the result', async () => {
      const createdUser = { ...mockUser, ...createDto, id: 2 };
      service.create.mockResolvedValue(createdUser);
      const result = await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return the result', async () => {
      service.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOne(mockUser.id);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });
});
