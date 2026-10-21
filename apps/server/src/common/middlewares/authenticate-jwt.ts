/**
 * NOTE: This is an initial draft / baseline implementation.
 * It should be reviewed, tested, and revised when integrating with AWS Cognito or test suites.
 */
import { Request, Response, NextFunction } from 'express';
import { cognitoVerifier } from '../../config/aws-clients.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import { db } from '../../db/client.js';
import { users, User } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    let cognitoSub: string;

    // Support mock token for local testing without AWS Cognito
    if ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && token.startsWith('mock-token-')) {
      cognitoSub = token.replace('mock-token-', '');
    } else {
      try {
        const payload = await cognitoVerifier.verify(token);
        cognitoSub = payload.sub;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Invalid or expired authentication token';
        throw new UnauthorizedError(message);
      }
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.cognito_sub, cognitoSub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User profile not found. Please sync your account.');
    }

    req.user = user;
    next();
  }
);
