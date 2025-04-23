import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from '../user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import { UserDto } from '../dto/user.dto';

const mockUserRepository: Partial<IUserRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: IUserRepository;

  const mockUserDto: UserDto = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<IUserRepository>(USER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      name: 'New User',
      email: 'new@example.com',
    };
    const createdUserDto: UserDto = {
      id: 2,
      name: createDto.name,
      email: createDto.email,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };

    it('should create a user successfully', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(createdUserDto);

      const result = await service.create(createDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(createDto.email);
      expect(userRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdUserDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUserDto);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(createDto.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUserDto);
      const result = await service.findOne(mockUserDto.id);
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserDto.id);
      expect(result).toEqual(mockUserDto);
    });

    it('should throw NotFoundException if user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(userRepository.findById).toHaveBeenCalledWith(999);
    });
  });
});
