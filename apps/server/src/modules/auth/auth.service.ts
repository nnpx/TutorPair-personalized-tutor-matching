import { authRepository, UserWithProfileStatus } from './auth.repository.js';
import { UserRole } from '@tutorpair/shared';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/http-errors.js';
import { env } from '../../config/env.js';
import { User } from '../../db/schema/index.js';

export interface SyncResult extends User {
  is_new_user: boolean;
}

export const authService = {
  async syncUser(
    cognitoSub: string,
    email: string,
    requestedRole: UserRole
  ): Promise<SyncResult> {
    // 1. Check if user already exists by cognito_sub
    const existingUser = await authRepository.findByCognitoSub(cognitoSub);
    if (existingUser) {
      // Role is immutable — return existing user without updating role
      return {
        ...existingUser,
        is_new_user: false,
      };
    }

    // 2. Prevent duplicate accounts with the same email across different providers
    const existingByEmail = await authRepository.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictError(
        'An account with this email address already exists. Please sign in with your original provider.',
        { email }
      );
    }

    // 3. Prevent privilege escalation & invalid role: self-registration cannot create ADMIN
    if (requestedRole !== UserRole.STUDENT && requestedRole !== UserRole.TUTOR) {
      throw new BadRequestError(
        "Invalid role. Self-registration is restricted to 'STUDENT' or 'TUTOR'."
      );
    }

    // 4. Provision new user in PostgreSQL
    const newUser = await authRepository.createUser({
      cognito_sub: cognitoSub,
      email,
      role: requestedRole,
    });

    return {
      ...newUser,
      is_new_user: true,
    };
  },

  async getCurrentUser(userId: string): Promise<UserWithProfileStatus> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestError('Invalid user ID parameter');
    }

    const user = await authRepository.findUserWithProfileStatus(userId);
    if (!user) {
      throw new NotFoundError('User profile not found. Please sync your account.');
    }

    return user;
  },

  async mockLogin(role: UserRole, customEmail?: string) {
    if (env.NODE_ENV === 'production') {
      throw new ForbiddenError(
        'Mock authentication endpoint is disabled in production environments'
      );
    }

    const sanitizedEmail =
      customEmail?.trim().toLowerCase() || `${role.toLowerCase()}@tutorpair.local`;
    const cognitoSub = customEmail
      ? `mock-${role.toLowerCase()}-${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '-')}`
      : `mock-${role.toLowerCase()}-id`;

    let user = await authRepository.findByCognitoSub(cognitoSub);

    if (!user) {
      const existingByEmail = await authRepository.findByEmail(sanitizedEmail);
      if (existingByEmail) {
        user = existingByEmail;
      } else {
        user = await authRepository.createUser({
          cognito_sub: cognitoSub,
          email: sanitizedEmail,
          role,
        });
      }
    }

    return {
      token: `mock-token-${cognitoSub}`,
      user: {
        id: user.id,
        cognito_sub: user.cognito_sub,
        email: user.email,
        role: user.role,
      },
    };
  },
};
