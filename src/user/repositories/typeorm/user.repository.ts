import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IUserRepository } from '../user.repository.interface';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const userToUpdate = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!userToUpdate) {
      return null;
    }
    return this.userRepository.save(userToUpdate);
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
