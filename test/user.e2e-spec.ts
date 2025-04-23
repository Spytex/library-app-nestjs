import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';
import { ResponseTransformerInterceptor } from '../src/common/interceptors/response-transformer.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { User } from '../src/user/user.entity';
import { Review } from 'src/library/review/review.entity';
import { Loan } from 'src/library/loan/loan.entity';
import { Book } from 'src/library/book/book.entity';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdUserId: number | undefined;

  const baseCreateUserDto: CreateUserDto = {
    name: 'E2E Test User',
    email: `e2e-${Date.now()}@test.com`,
  };
  let uniqueCreateUserDto: CreateUserDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalInterceptors(new ResponseTransformerInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());

    dataSource = moduleFixture.get<DataSource>(DataSource);

    await app.init();
  });

  beforeEach(async () => {
    // Get repositories
    const reviewRepo = dataSource.getRepository(Review);
    const loanRepo = dataSource.getRepository(Loan);
    const bookRepo = dataSource.getRepository(Book);
    const userRepo = dataSource.getRepository(User);

    try {
      if (reviewRepo) await reviewRepo.delete({});
      if (loanRepo) await loanRepo.delete({});
      if (bookRepo) await bookRepo.delete({});
      await userRepo.delete({});
    } catch (error) {
      console.error('Error during table cleanup:', error);
      throw error;
    }

    uniqueCreateUserDto = {
      ...baseCreateUserDto,
      email: `e2e-${Date.now()}@test.com`,
    };
    createdUserId = undefined;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  const createUserDirectly = async (dto: CreateUserDto): Promise<User> => {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create(dto);
    return await userRepository.save(user);
  };

  describe('/users (POST)', () => {
    it('should create a user successfully', async () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(uniqueCreateUserDto)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
          expect(response.body.data.id).toBeDefined();
          expect(response.body.data.name).toEqual(uniqueCreateUserDto.name);
          expect(response.body.data.email).toEqual(uniqueCreateUserDto.email);
          expect(response.body.meta.pagination).toBeUndefined();
        });
    });

    it('should fail to create a user with duplicate email', async () => {
      await createUserDirectly(uniqueCreateUserDto); // Use helper

      return request(app.getHttpServer())
        .post('/users')
        .send(uniqueCreateUserDto)
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('CONFLICT');
          expect(response.body.error.message).toContain('already exists');
        });
    });
  });

  describe('/users (GET)', () => {
    it('should get an empty list when no users exist', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([]);
          expect(response.body.meta.pagination).toBeDefined();
          expect(response.body.meta.pagination.totalItems).toEqual(0);
          expect(response.body.meta.pagination.totalPages).toEqual(0);
        });
    });

    it('should get a list of users (paginated)', async () => {
      await createUserDirectly({ name: 'User A', email: 'a@test.com' });
      await createUserDirectly({ name: 'User B', email: 'b@test.com' });

      return request(app.getHttpServer())
        .get('/users?page=1&limit=1')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.meta.pagination).toBeDefined();
          expect(response.body.meta.pagination.page).toEqual(1);
          expect(response.body.meta.pagination.limit).toEqual(1);
          expect(response.body.meta.pagination.totalItems).toEqual(2);
          expect(response.body.meta.pagination.totalPages).toEqual(2);
        });
    });

    it('should filter users by name', async () => {
      const userToFind = await createUserDirectly({
        name: 'Find Me',
        email: 'find@test.com',
      });
      await createUserDirectly({
        name: 'Another User',
        email: 'another@test.com',
      });
      const nameFilter = 'Find Me';

      return request(app.getHttpServer())
        .get(`/users?name=${encodeURIComponent(nameFilter)}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].id).toEqual(userToFind.id);
          expect(response.body.data[0].name).toEqual(nameFilter);
          expect(response.body.meta.pagination).toBeDefined();
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should filter users by email', async () => {
      const userToFind = await createUserDirectly({
        name: 'Email User',
        email: 'find.email@test.com',
      });
      await createUserDirectly({
        name: 'Another User',
        email: 'another.email@test.com',
      });
      const emailFilter = 'find.email@test.com';

      return request(app.getHttpServer())
        .get(`/users?email=${encodeURIComponent(emailFilter)}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.data[0].id).toEqual(userToFind.id);
          expect(response.body.data[0].email).toEqual(emailFilter);
          expect(response.body.meta.pagination).toBeDefined();
          expect(response.body.meta.pagination.totalItems).toEqual(1);
        });
    });

    it('should handle pagination correctly (page 2)', async () => {
      await createUserDirectly({ name: 'User 1', email: '1@test.com' });
      await createUserDirectly({ name: 'User 2', email: '2@test.com' });
      await createUserDirectly({ name: 'User 3', email: '3@test.com' });

      return request(app.getHttpServer())
        .get('/users?page=2&limit=2')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toEqual(1);
          expect(response.body.meta.pagination.page).toEqual(2);
          expect(response.body.meta.pagination.limit).toEqual(2);
          expect(response.body.meta.pagination.totalItems).toEqual(3);
          expect(response.body.meta.pagination.totalPages).toEqual(2);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get a specific user by ID', async () => {
      const createdUser = await createUserDirectly(uniqueCreateUserDto);

      return request(app.getHttpServer())
        .get(`/users/${createdUser.id}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdUser.id);
          expect(response.body.data.name).toEqual(uniqueCreateUserDto.name);
          expect(response.body.data.email).toEqual(uniqueCreateUserDto.email);
        });
    });

    it('should return 404 for a non-existent user ID', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for an invalid user ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message).toContain('numeric string');
        });
    });
  });

  describe('/users/:id (PATCH)', () => {
    const updateUserDto: UpdateUserDto = { name: 'Updated E2E User' };

    it('should update a user name successfully', async () => {
      const createdUser = await createUserDirectly(uniqueCreateUserDto);

      return request(app.getHttpServer())
        .patch(`/users/${createdUser.id}`)
        .send(updateUserDto)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdUser.id);
          expect(response.body.data.name).toEqual(updateUserDto.name);
          expect(response.body.data.email).toEqual(createdUser.email);
        });
    });

    it('should update user email successfully', async () => {
      const createdUser = await createUserDirectly(uniqueCreateUserDto);
      const dynamicUpdateEmailDto = { email: `updated-${Date.now()}@test.com` };

      return request(app.getHttpServer())
        .patch(`/users/${createdUser.id}`)
        .send(dynamicUpdateEmailDto)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdUser.id);
          expect(response.body.data.email).toEqual(dynamicUpdateEmailDto.email);
          expect(response.body.data.name).toEqual(createdUser.name);
        });
    });

    it('should fail to update with an email already in use by another user', async () => {
      const userToUpdate = await createUserDirectly(uniqueCreateUserDto);

      const otherUserDto: CreateUserDto = {
        name: 'Other User',
        email: `other-${Date.now()}@test.com`,
      };
      const otherUser = await createUserDirectly(otherUserDto);

      return request(app.getHttpServer())
        .patch(`/users/${userToUpdate.id}`)
        .send({ email: otherUser.email })
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('CONFLICT');
          expect(response.body.error.message).toContain('is already in use');
        });
    });

    it('should allow updating other fields when email is the same', async () => {
      const createdUser = await createUserDirectly(uniqueCreateUserDto);
      const updateWithSameEmail: UpdateUserDto = {
        name: 'New Name Same Email',
        email: createdUser.email,
      };

      return request(app.getHttpServer())
        .patch(`/users/${createdUser.id}`)
        .send(updateWithSameEmail)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body.data.id).toEqual(createdUser.id);
          expect(response.body.data.name).toEqual(updateWithSameEmail.name);
          expect(response.body.data.email).toEqual(createdUser.email);
        });
    });

    it('should return 404 when trying to update a non-existent user', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .send(updateUserDto)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for invalid user ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .patch('/users/invalid-id')
        .send(updateUserDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message).toContain('numeric string');
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user successfully', async () => {
      const createdUser = await createUserDirectly(uniqueCreateUserDto);

      return request(app.getHttpServer())
        .delete(`/users/${createdUser.id}`)
        .expect(HttpStatus.NO_CONTENT)
        .then(async () => {
          const userRepository = dataSource.getRepository(User);
          const findUser = await userRepository.findOneBy({
            id: createdUser.id,
          });
          expect(findUser).toBeNull();
        });
    });

    it('should return 404 when trying to delete a non-existent user', async () => {
      const nonExistentId = 999999;
      return request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    it('should return 400 for an invalid user ID format (non-numeric)', async () => {
      return request(app.getHttpServer())
        .delete('/users/invalid-id')
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toEqual('BAD_REQUEST');
          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message).toContain('numeric string');
        });
    });
  });
});
