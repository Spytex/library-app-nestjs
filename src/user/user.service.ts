import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../db/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { eq } from 'drizzle-orm';

type DrizzleDB = PostgresJsDatabase<typeof schema>;
type UserSelect = typeof schema.users.$inferSelect;

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private db: DrizzleDB,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserSelect> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, createUserDto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException(
        `User with email "${createUserDto.email}" already exists`,
      );
    }

    const [newUser] = await this.db
      .insert(users)
      .values(createUserDto)
      .returning();
    return newUser;
  }

  async findAll(): Promise<UserSelect[]> {
    return this.db.select().from(users);
  }

  async findOne(id: number): Promise<UserSelect> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserSelect> {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, updateUserDto.email))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== id) {
        throw new ConflictException(
          `User with email "${updateUserDto.email}" already exists`,
        );
      }
    }

    const [updatedUser] = await this.db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException(
        `User with ID "${id}" not found during update`,
      );
    }
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const result = await this.db.delete(users).where(eq(users.id, id));
  }
}
