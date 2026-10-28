import { Router } from 'express';
import { MatchRequestSchema, UserRole } from '@tutorpair/shared';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { matchingController } from './matching.controller.js';

const router = Router();

// TP-8: authenticate -> role guard -> validate -> handler
router.post(
  '/',
  authenticate,
  requireRole([UserRole.STUDENT]),
  validateRequest(MatchRequestSchema),
  matchingController.runMatch
);

// TODO (TP-9): POST /:matchRequestId/confirm. GET /history belongs to Module 7.

export const matchingRouter = router;
