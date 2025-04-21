import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { mapToUserDto } from '../../../common/mappers';
import { CreateUserDto } from '../../dto/create-user.dto';
import { FindUsersQueryDto } from '../../dto/find-users-query.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserDto } from '../../dto/user.dto';
import { User } from '../../user.entity';
import {
  IUserFilterCriteria,
  IUserRepository,
} from '../user.repository.interface';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const newUser = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(newUser);
    return mapToUserDto(savedUser);
  }

  async findAll(query: FindUsersQueryDto): Promise<UserDto[]> {
    const { limit = 10, page = 1, name, email } = query;
    const offset = (page - 1) * limit;
    const where: FindOptionsWhere<User> = {};

    if (name) where.name = ILike(`%${name}%`);
    if (email) where.email = ILike(`%${email}%`);

    const users = await this.userRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return users.map(mapToUserDto);
  }

  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user ? mapToUserDto(user) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user ? mapToUserDto(user) : null;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto | null> {
    const userToUpdate = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!userToUpdate) {
      return null;
    }
    const updatedUser = await this.userRepository.save(userToUpdate);
    return mapToUserDto(updatedUser);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }

  async count(criteria?: IUserFilterCriteria): Promise<number> {
    const where: FindOptionsWhere<User> = {};
    if (criteria?.name) where.name = ILike(`%${criteria.name}%`);
    if (criteria?.email) where.email = ILike(`%${criteria.email}%`);
    return this.userRepository.count({ where });
  }
}
