import { Response, NextFunction } from 'express';
import { UserRole } from '@tutorpair/shared';
import { AuthRequest } from './authenticate-jwt.js';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors.js';

export function requireRole(allowedRoles: (UserRole | keyof typeof UserRole)[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required before checking permissions'));
      return;
    }

    const userRole = req.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      next(
        new ForbiddenError(
          `Access denied. Required role: [${allowedRoles.join(', ')}], Current role: ${userRole}`
        )
      );
      return;
    }

    next();
  };
}
