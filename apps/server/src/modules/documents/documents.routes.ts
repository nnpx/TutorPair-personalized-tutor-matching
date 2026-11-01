import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import {
  UserRole,
  PresignedUploadRequestSchema,
  ConfirmUploadSchema,
  UuidParamSchema,
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
  validateRequest(UuidParamSchema, 'params'),
  documentsController.deleteDocument
);

// 4. Mock S3 direct PUT handler for local development (no AWS credentials required)
router.put('/mock-s3-upload/*', (_req, res) => {
  res.status(200).send('OK');
});

// 5. Mock S3 direct GET handler for local preview (simulates presigned GET)
router.get('/mock-s3-view/*', (req, res) => {
  const fileKey = decodeURIComponent((req.params as Record<string, string>)[0] || 'tutor-document.pdf');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TutorPair — Verified Document Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 3rem 1.5rem;
      background: #f9fafb;
      color: #111827;
      display: flex;
      justify-content: center;
    }
    .card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 800;
    }
    .meta {
      font-size: 0.8125rem;
      color: #6b7280;
      word-break: break-all;
      padding: 0.75rem;
      background: #f3f4f6;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .section {
      margin-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
      padding-top: 1.25rem;
    }
    h2 {
      font-size: 1.05rem;
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }
    p, li {
      font-size: 0.9375rem;
      color: #4b5563;
      line-height: 1.6;
    }
    ul {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">TutorPair Verified Credential</span>
    <h1>Tutor CV / Professional Resume</h1>
    <p>This is a simulated secure preview of the tutor's verified Curriculum Vitae via S3 presigned URL architecture.</p>
    
    <div class="meta">
      <strong>S3 Object Key:</strong> ${fileKey}
    </div>

    <div class="section">
      <h2>Verified Qualifications & Background</h2>
      <ul>
        <li>Graduation transcripts and university credentials verified by TutorPair administration.</li>
        <li>Specialized subject-level proficiency certificates confirmed.</li>
        <li>Full background check, identity, and contact channels certified.</li>
      </ul>
    </div>
  </div>
</body>
</html>`);
});

export const documentsRouter = router;

