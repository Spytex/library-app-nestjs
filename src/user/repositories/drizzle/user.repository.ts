import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../db/drizzle.module';
import * as schema from '../../../db/schema';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IUserRepository } from '../user.repository.interface';
import { UserDto } from '../../dto/user.dto';
import { mapDrizzleUserToDto } from '../../../common/mappers';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const result = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return mapDrizzleUserToDto(result[0]);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.db.select().from(schema.users);
    return users.map(mapDrizzleUserToDto);
  }

  async findById(id: number): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result.length > 0 ? mapDrizzleUserToDto(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result.length > 0 ? mapDrizzleUserToDto(result[0]) : null;
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
    return result.length > 0 ? mapDrizzleUserToDto(result[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });
    return result.length > 0;
  }
}
