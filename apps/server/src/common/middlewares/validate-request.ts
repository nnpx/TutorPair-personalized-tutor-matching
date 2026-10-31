/**
 * NOTE: This is an initial draft / baseline implementation.
 * It should be reviewed, tested, and revised when integrating request validation.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/http-errors.js';

export function validateRequest(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.') || source,
          message: i.message,
        }));
        next(new BadRequestError('Request validation failed', issues));
        return;
      }
      next(err);
    }
  };
}
