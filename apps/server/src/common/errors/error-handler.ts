import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.js';
import { errorResponse } from '../utils/response.util.js';
import { env } from '../../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.details));
    return;
  }

  console.error('Unhandled Application Error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(500).json(errorResponse(message));
}
