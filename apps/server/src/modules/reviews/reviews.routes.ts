import { Router } from 'express';
import { CreateReviewSchema, UserRole } from '@tutorpair/shared';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { reviewsController } from './reviews.controller.js';

const router = Router();

// TP-30: Submit review for a confirmed match
router.post(
  '/',
  authenticate,
  requireRole([UserRole.STUDENT]),
  validateRequest(CreateReviewSchema),
  reviewsController.submitReview
);

// Pre-fetch recommendation context for review submission form
router.get(
  '/recommendation/:recommendationId',
  authenticate,
  requireRole([UserRole.STUDENT]),
  reviewsController.getRecommendationContext
);

// TP-19: Get tutor reviews and rating breakdown
router.get(
  '/tutor/:tutorId',
  reviewsController.getTutorReviews
);

export const reviewsRouter = router;
