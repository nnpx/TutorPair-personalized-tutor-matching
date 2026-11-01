import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { authController } from '../auth/auth.controller.js';

const router = Router();

/**
 * GET /api/users/me (Alias for /api/auth/me)
 * Retrieves authenticated user session and role.
 */
router.get('/me', authenticate, authController.getMe);

export const usersRouter = router;
