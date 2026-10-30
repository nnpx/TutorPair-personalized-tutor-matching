import { z } from 'zod';
import { VerificationStatus } from '../enums/index.js';

export const VerifyTutorSchema = z.object({
  status: z.enum([VerificationStatus.APPROVED, VerificationStatus.REJECTED]),
  rejection_reason: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    if (data.status === VerificationStatus.REJECTED && (!data.rejection_reason || data.rejection_reason.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when rejecting a tutor application',
    path: ['rejection_reason'],
  }
);

export const AdminTutorsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).optional(),
});

export const TutorDocumentParamsSchema = z.object({
  id: z.string().uuid('Invalid tutor ID: must be a valid UUID'),
  docId: z.string().uuid('Invalid document ID: must be a valid UUID'),
});

export type VerifyTutorInput = z.infer<typeof VerifyTutorSchema>;
export type AdminTutorsQueryInput = z.infer<typeof AdminTutorsQuerySchema>;
export type TutorDocumentParamsInput = z.infer<typeof TutorDocumentParamsSchema>;
