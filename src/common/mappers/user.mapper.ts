import { plainToInstance } from 'class-transformer';
import { UserSelect } from '../../database/drizzle/schema';
import { UserDto } from '../../user/dto/user.dto';
import { User } from '../../user/user.entity';

type UserSource = User | UserSelect;

export function mapToUserDto<T extends UserSource | UserSource[]>(
  source: T,
): T extends UserSource[] ? UserDto[] : UserDto {
  return plainToInstance(UserDto, source, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  }) as T extends UserSource[] ? UserDto[] : UserDto;
}
