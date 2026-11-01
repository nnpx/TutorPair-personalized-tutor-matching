import { Request, Response, NextFunction } from 'express';
import { cognitoVerifier } from '../../config/aws-clients.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import { User } from '../../db/schema/index.js';
import { authRepository } from '../../modules/auth/auth.repository.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';

export interface AuthRequest extends Request {
  user?: User;
  cognitoUser?: {
    sub: string;
    email: string;
  };
}

export const authenticate = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    let cognitoSub: string;
    let cognitoEmail: string | undefined;

    // Strict security check: reject mock tokens in production
    if (env.NODE_ENV === 'production' && token.startsWith('mock-token-')) {
      throw new UnauthorizedError('Mock authentication is disabled in production');
    }

    // Support mock token for local testing without AWS Cognito
    if ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && token.startsWith('mock-token-')) {
      cognitoSub = token.replace('mock-token-', '');
      cognitoEmail =
        typeof req.headers['x-mock-email'] === 'string' && req.headers['x-mock-email'].trim()
          ? (req.headers['x-mock-email'] as string).trim()
          : `${cognitoSub}@tutorpair.local`;
    } else {
      try {
        const payload = await cognitoVerifier.verify(token);
        cognitoSub = payload.sub;
        cognitoEmail = typeof payload.email === 'string' ? payload.email : undefined;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Invalid or expired authentication token';
        throw new UnauthorizedError(message);
      }
    }

    // Store verified identity claims from Cognito/Mock
    req.cognitoUser = {
      sub: cognitoSub,
      email: cognitoEmail || `${cognitoSub}@tutorpair.local`,
    };

    // Lookup user via Repository layer (encapsulates Drizzle ORM / SQL query)
    let user = await authRepository.findByCognitoSub(cognitoSub);
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!user && UUID_REGEX.test(cognitoSub)) {
      // Fallback: check by user.id in case UUID was passed in mock token
      user = await authRepository.findById(cognitoSub);
    }
    const isSyncRoute = req.originalUrl?.includes('/api/auth/sync') || req.path === '/sync';
    if (!user && cognitoEmail && !isSyncRoute) {
      // Fallback: check by email in case of mock user session
      user = await authRepository.findByEmail(cognitoEmail);
    }

    if (user) {
      req.user = user;
      return next();
    }

    // If user does not exist in DB yet:
    // Allow /api/auth/sync to proceed so first-time users can register/sync
    if (isSyncRoute) {
      return next();
    }

    // All other protected routes require an existing database record
    throw new UnauthorizedError('User profile not found. Please sync your account.');
  }
);
