import { User } from '../../user/user.entity';
import { UserDto } from '../../user/dto/user.dto';
import { UserSelect } from '../../db/schema';

export function mapUserToDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapDrizzleUserToDto(user: UserSelect): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
