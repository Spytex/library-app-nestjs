import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDto } from '../dto/user.dto';

export type IUserFilterCriteria = Omit<
  FindUsersQueryDto,
  keyof PaginationQueryDto
>;

export interface IUserRepository {
  create(createUserDto: CreateUserDto): Promise<UserDto>;
  findAll(query: FindUsersQueryDto): Promise<UserDto[]>;
  findById(id: number): Promise<UserDto | null>;
  findByEmail(email: string): Promise<UserDto | null>;
  update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto | null>;
  remove(id: number): Promise<boolean>;
  count(criteria?: IUserFilterCriteria): Promise<number>;
}

export const USER_REPOSITORY = 'IUserRepository';
