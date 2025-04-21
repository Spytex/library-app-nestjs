import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { IPaginatedResult } from '../utils/pagination.utils';

export interface IBaseRepository<
  T,
  CreateDto,
  UpdateDto,
  FilterDto extends PaginationQueryDto,
> {
  create(createDto: CreateDto): Promise<T>;
  findAll(query: FilterDto): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  update(id: number, updateDto: UpdateDto): Promise<T | null>;
  remove(id: number): Promise<boolean>;
  count(criteria: Omit<FilterDto, keyof PaginationQueryDto>): Promise<number>;
}

export interface IBaseService<
  T,
  CreateDto,
  UpdateDto,
  FilterDto extends PaginationQueryDto,
> {
  create(createDto: CreateDto): Promise<T>;
  findAll(query: FilterDto): Promise<IPaginatedResult<T>>;
  findOne(id: number): Promise<T>;
  update(id: number, updateDto: UpdateDto): Promise<T>;
  remove(id: number): Promise<void>;
}
