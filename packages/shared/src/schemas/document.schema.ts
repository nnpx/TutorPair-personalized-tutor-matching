import { z } from 'zod';
import { DocumentType } from '../enums/index.js';

export const PresignedUploadRequestSchema = z.object({
  file_name: z.string().min(1, 'File name is required').max(255),
  // Maximum 10MB = 10 * 1024 KB = 10240 KB
  file_size_kb: z.number().int().positive().max(10240, 'File size cannot exceed 10MB'),
  document_type: z.nativeEnum(DocumentType),
  variant_id: z.string().uuid().optional().nullable(),
});

export const ConfirmUploadSchema = z.object({
  file_key: z.string().min(1, 'File key is required'),
  file_size_kb: z.number().int().positive().max(10240),
  document_type: z.nativeEnum(DocumentType),
  variant_id: z.string().uuid().optional().nullable(),
});

export type PresignedUploadRequestInput = z.infer<typeof PresignedUploadRequestSchema>;
export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>;
