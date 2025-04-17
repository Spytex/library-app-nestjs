import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../user.entity';
import { UserSelect } from '../../db/schema';

export type UserRepresentation = User | UserSelect;

export interface IUserRepository {
  create(createUserDto: CreateUserDto): Promise<UserRepresentation>;
  findAll(): Promise<UserRepresentation[]>;
  findById(id: number): Promise<UserRepresentation | null>;
  findByEmail(email: string): Promise<UserRepresentation | null>;
  update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserRepresentation | null>;
  remove(id: number): Promise<boolean>;
}

export const USER_REPOSITORY = 'IUserRepository';
