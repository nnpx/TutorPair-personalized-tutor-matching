import { Response } from 'express';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { UnauthorizedError } from '../../common/errors/http-errors.js';

export const authController = {
  sync: asyncHandler(async (req: AuthRequest, res: Response) => {
    // Identity comes either from established req.user or verified req.cognitoUser
    const cognitoSub = req.user?.cognito_sub || req.cognitoUser?.sub;
    const email = req.user?.email || req.cognitoUser?.email;

    if (!cognitoSub || !email) {
      throw new UnauthorizedError('Unable to identify user from authentication token');
    }

    const { role } = req.body;
    const result = await authService.syncUser(cognitoSub, email, role);

    const statusCode = result.is_new_user ? 201 : 200;
    const message = result.is_new_user
      ? 'User account synchronized and registered successfully'
      : 'User session synchronized successfully';

    res.status(statusCode).json(
      successResponse(
        {
          id: result.id,
          cognito_sub: result.cognito_sub,
          email: result.email,
          role: result.role,
          is_new_user: result.is_new_user,
          created_at: result.created_at,
        },
        message
      )
    );
  }),

  getMe: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json(
      successResponse(
        {
          id: user.id,
          cognito_sub: user.cognito_sub,
          email: user.email,
          role: user.role,
          profile_completed: user.profile_completed,
          ...(user.verification_status ? { verification_status: user.verification_status } : {}),
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        'User session fetched successfully'
      )
    );
  }),

  mockLogin: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, email } = req.body;
    const result = await authService.mockLogin(role, email);

    res.status(200).json(successResponse(result, 'Mock login successful'));
  }),

  logout: asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.status(200).json(successResponse(null, 'User logged out successfully'));
  }),
};
