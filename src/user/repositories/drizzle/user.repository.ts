import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../db/drizzle.module';
import * as schema from '../../../db/schema';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IUserRepository } from '../user.repository.interface';
import { UserDto } from '../../dto/user.dto';
import { UserSelect } from '../../../db/schema';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  private mapToDto(user: UserSelect): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const result = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return this.mapToDto(result[0]);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.db.select().from(schema.users);
    return users.map(this.mapToDto);
  }

  async findById(id: number): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result.length > 0 ? this.mapToDto(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result.length > 0 ? this.mapToDto(result[0]) : null;
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
    return result.length > 0 ? this.mapToDto(result[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });
    return result.length > 0;
  }
}
