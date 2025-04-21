import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository.interface';
import { UserDto } from './dto/user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import {
  IPaginatedResult,
  createPaginatedResponse,
} from '../common/utils/pagination.utils';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException(
        `User with email "${createUserDto.email}" already exists.`,
      );
    }
    return this.userRepository.create(createUserDto);
  }

  async findAll(query: FindUsersQueryDto): Promise<IPaginatedResult<UserDto>> {
    const { page = 1, limit = 10, ...filters } = query;
    const items = await this.userRepository.findAll(query);
    const totalItems = await this.userRepository.count(filters);
    return createPaginatedResponse<UserDto>(items, totalItems, page, limit);
  }

  async findOne(id: number): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<UserDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          `Email "${updateUserDto.email}" is already in use.`,
        );
      }
    }

    const updatedUser = await this.userRepository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.userRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async ensureUserExists(userId: number): Promise<UserDto> {
    return this.findOne(userId);
  }
}
