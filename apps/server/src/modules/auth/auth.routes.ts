import { Router } from 'express';
import { authenticate, AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';

const router = Router();

/**
 * POST /api/auth/sync
 * Authenticates the user token, auto-provisions user in PostgreSQL if first login,
 * and returns user account information.
 */
router.post(
  '/sync',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.user!;
    res.status(200).json(
      successResponse(
        {
          id: user.id,
          cognito_sub: user.cognito_sub,
          email: user.email,
          role: user.role,
        },
        'User synchronized successfully'
      )
    );
  })
);

export const authRouter = router;
