import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { UserRole } from '@tutorpair/shared';
import {
  PresignedUploadRequestSchema,
  ConfirmUploadSchema,
} from '@tutorpair/shared';
import { documentsController } from './documents.controller.js';

const router = Router();

// 1. Request presigned PUT URL for direct S3 upload
router.post(
  '/presigned-upload',
  authenticate,
  requireRole([UserRole.TUTOR]),
  validateRequest(PresignedUploadRequestSchema),
  documentsController.requestUpload
);

// 2. Confirm upload and record metadata in PostgreSQL
router.post(
  '/confirm',
  authenticate,
  requireRole([UserRole.TUTOR]),
  validateRequest(ConfirmUploadSchema),
  documentsController.confirmUpload
);

// 3. Delete an uploaded document
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.TUTOR]),
  documentsController.deleteDocument
);

// 4. Mock S3 direct PUT handler for local development (no AWS credentials required)
router.put('/mock-s3-upload/*', (_req, res) => {
  res.status(200).send('OK');
});

export const documentsRouter = router;
