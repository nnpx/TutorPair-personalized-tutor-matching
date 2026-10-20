import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { UserRole, VerifyTutorSchema } from '@tutorpair/shared';

const router = Router();

// Enforce authentication & ADMIN role for all admin routes
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));

/**
 * GET /api/admin/tutors
 * Retrieve tutors verification queue (optional filter ?status=PENDING|APPROVED|REJECTED|ALL)
 */
router.get('/tutors', adminController.getTutorsQueue);

/**
 * GET /api/admin/tutors/:id
 * Retrieve detailed tutor profile, subjects, and attached documents
 */
router.get('/tutors/:id', adminController.getTutorDetails);

/**
 * GET /api/admin/tutors/:id/documents/:docId/view-url
 * Generate short-lived (15 min) S3 Presigned GET URL for reviewing tutor documents
 */
router.get('/tutors/:id/documents/:docId/view-url', adminController.getDocumentViewUrl);

/**
 * POST /api/admin/tutors/reset-defaults
 * Reset mock tutor verification statuses back to default
 */
router.post('/tutors/reset-defaults', adminController.resetDefaults);

/**
 * PATCH /api/admin/tutors/:id/verify
 * Approve or reject tutor application with validation and automated notifications
 */
router.patch(
  '/tutors/:id/verify',
  validateRequest(VerifyTutorSchema),
  adminController.verifyTutor
);

export const adminRouter = router;
