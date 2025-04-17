import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IUserRepository } from '../user.repository.interface';
import { UserDto } from '../../dto/user.dto';
import { mapUserToDto } from '../../../common/mappers';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const newUser = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(newUser);
    return mapUserToDto(savedUser);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userRepository.find();
    return users.map(mapUserToDto);
  }

  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user ? mapUserToDto(user) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user ? mapUserToDto(user) : null;
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
    return mapUserToDto(updatedUser);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (
      result.affected !== undefined &&
      result.affected !== null &&
      result.affected > 0
    );
  }
}
