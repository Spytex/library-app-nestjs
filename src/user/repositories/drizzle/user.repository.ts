import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleDB } from '../../../db/drizzle.module';
import * as schema from '../../../db/schema';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import {
  IUserRepository,
  UserRepresentation,
} from '../user.repository.interface';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto): Promise<UserRepresentation> {
    const result = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<UserRepresentation[]> {
    return this.db.select().from(schema.users);
  }

  async findById(id: number): Promise<UserRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async findByEmail(email: string): Promise<UserRepresentation | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserRepresentation | null> {
    const result = await this.db
      .update(schema.users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });
    return result.length > 0;
  }
}
