import { Router } from 'express';
import { ConfirmTutorSelectionSchema, MatchRequestSchema, UserRole } from '@tutorpair/shared';
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

// TP-9: student confirms exactly one of the recommended tutors
router.post(
  '/:matchRequestId/confirm',
  authenticate,
  requireRole([UserRole.STUDENT]),
  validateRequest(ConfirmTutorSelectionSchema),
  matchingController.confirmSelection
);

// GET /history belongs to Module 7 (TP-10).

export const matchingRouter = router;
