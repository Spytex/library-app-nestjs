import { IPaginationMeta } from '../interfaces/api-response.interface';

export interface IPaginatedResult<T> {
  items: T[];
  meta: {
    pagination: IPaginationMeta;
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): IPaginatedResult<T> {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    meta: {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    },
  };
}
