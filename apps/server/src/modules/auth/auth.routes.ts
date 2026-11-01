import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { SyncUserSchema, MockLoginSchema } from '@tutorpair/shared';
import { authController } from './auth.controller.js';

const router = Router();

/**
 * POST /api/auth/sync
 * Synchronizes authenticated Cognito/Google session to PostgreSQL users table.
 * Establishes user role on first login (STUDENT or TUTOR).
 */
router.post(
  '/sync',
  authenticate,
  validateRequest(SyncUserSchema),
  authController.sync
);

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session, role, and profile onboarding status.
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * POST /api/auth/mock-login
 * Development utility for fast testing with mock accounts (disabled in production).
 */
router.post(
  '/mock-login',
  validateRequest(MockLoginSchema),
  authController.mockLogin
);

/**
 * POST /api/auth/logout
 * Stateless session termination acknowledgment.
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

export const authRouter = router;
