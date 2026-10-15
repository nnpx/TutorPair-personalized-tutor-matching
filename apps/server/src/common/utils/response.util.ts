import { ApiResponse } from '@tutorpair/shared';

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(message: string, details?: unknown): ApiResponse<null> {
  return {
    success: false,
    message,
    details,
  };
}
