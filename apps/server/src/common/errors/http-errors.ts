import { AppError } from './app-error.js';

/**
 * 400 Bad Request
 * Use when client input fails validation or request is malformed.
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, details);
  }
}

/**
 * 401 Unauthorized
 * Use when authentication is required and has failed or is missing.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized: Authentication required') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Use when user is authenticated but does not have permission for this resource.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Insufficient permissions') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * Use when requested resource (user, tutor, subject, match, etc.) does not exist.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Use when request conflicts with current state (e.g. duplicate email, overlapping schedule).
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, details);
  }
}

/**
 * 422 Unprocessable Entity
 * Use when request format is valid but contains semantic business rule errors.
 */
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(message, 422, details);
  }
}

/**
 * 429 Too Many Requests
 * Use when rate limiting thresholds are exceeded.
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429);
  }
}

/**
 * 500 Internal Server Error
 * Use for unexpected internal errors that should be surfaced as operational errors.
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}
