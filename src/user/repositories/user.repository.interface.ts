import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDto } from '../dto/user.dto';

export interface IUserRepository {
  create(createUserDto: CreateUserDto): Promise<UserDto>;
  findAll(): Promise<UserDto[]>;
  findById(id: number): Promise<UserDto | null>;
  findByEmail(email: string): Promise<UserDto | null>;
  update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto | null>;
  remove(id: number): Promise<boolean>;
}

export const USER_REPOSITORY = 'IUserRepository';
