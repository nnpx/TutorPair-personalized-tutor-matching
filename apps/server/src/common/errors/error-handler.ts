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
  // Operational AppError subclasses (BadRequestError, NotFoundError, ConflictError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.details));
    return;
  }

  // Handle malformed JSON body parse error from express.json()
  if (
    ('type' in err && (err as { type: string }).type === 'entity.parse.failed') ||
    (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400)
  ) {
    res.status(400).json(errorResponse('Malformed JSON in request body'));
    return;
  }

  // Handle common PostgreSQL database error codes defensively
  if ('code' in err) {
    const pgCode = (err as { code: string }).code;
    if (pgCode === '22P02') {
      res.status(400).json(errorResponse('Invalid parameter format: expected valid UUID'));
      return;
    }
    if (pgCode === '23505') {
      res.status(409).json(errorResponse('A record with these details already exists'));
      return;
    }
    if (pgCode === '23503') {
      res.status(400).json(errorResponse('Referenced record does not exist'));
      return;
    }
  }

  console.error('Unhandled Application Error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(500).json(errorResponse(message));
}
