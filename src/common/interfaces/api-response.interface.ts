export interface IPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface IResponseMeta {
  timestamp: string;
  path?: string;
  duration?: number;
  pagination?: IPaginationMeta;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data: T;
  meta: IResponseMeta;
}

export interface IApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  meta: IResponseMeta;
}
