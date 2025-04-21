import { Inject, Injectable } from '@nestjs/common';
import { and, count as drizzleCount, eq, ilike, SQL, desc } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from 'src/database/drizzle/drizzle.module';
import * as schema from 'src/database/drizzle/schema';
import { mapToUserDto } from '../../../common/mappers';
import { CreateUserDto } from '../../dto/create-user.dto';
import { FindUsersQueryDto } from '../../dto/find-users-query.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserDto } from '../../dto/user.dto';
import {
  IUserFilterCriteria,
  IUserRepository,
} from '../user.repository.interface';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const result = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return mapToUserDto(result[0]);
  }

  async findAll(query: FindUsersQueryDto): Promise<UserDto[]> {
    const { limit = 10, page = 1, name, email } = query;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (name) conditions.push(ilike(schema.users.name, `%${name}%`));
    if (email) conditions.push(ilike(schema.users.email, `%${email}%`));

    const users = await this.db
      .select()
      .from(schema.users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.users.createdAt));

    return users.map(mapToUserDto);
  }

  async findById(id: number): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result.length > 0 ? mapToUserDto(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result.length > 0 ? mapToUserDto(result[0]) : null;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto | null> {
    const result = await this.db
      .update(schema.users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result.length > 0 ? mapToUserDto(result[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });
    return result.length > 0;
  }

  async count(criteria?: IUserFilterCriteria): Promise<number> {
    const conditions: SQL[] = [];
    if (criteria?.name)
      conditions.push(ilike(schema.users.name, `%${criteria.name}%`));
    if (criteria?.email)
      conditions.push(ilike(schema.users.email, `%${criteria.email}%`));

    const result = await this.db
      .select({ count: drizzleCount(schema.users.id) })
      .from(schema.users)
      .where(and(...conditions));
    return result[0].count;
  }
}
