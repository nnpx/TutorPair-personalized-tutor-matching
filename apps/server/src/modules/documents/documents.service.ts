import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/http-errors.js';
import { documentsRepository } from './documents.repository.js';
import {
  DocumentType,
  type PresignedUploadRequestInput,
  type ConfirmUploadInput,
} from '@tutorpair/shared';

const MAX_FILE_SIZE_KB = 10 * 1024; // 10MB
const MAX_TOTAL_STORAGE_KB = 100 * 1024; // 100MB

export const documentsService = {
  async generatePresignedUploadUrl(tutorId: string, input: PresignedUploadRequestInput) {
    if (input.file_size_kb > MAX_FILE_SIZE_KB) {
      throw new BadRequestError('File size exceeds maximum allowed size of 10MB.');
    }

    const currentTotalKb = await documentsRepository.getTotalStorageKb(tutorId);
    if (currentTotalKb + input.file_size_kb > MAX_TOTAL_STORAGE_KB) {
      throw new BadRequestError('Total uploaded document storage exceeds 100MB limit for this account.');
    }

    const rawExt = path.extname(input.file_name).toLowerCase() || '.pdf';
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = allowedExts.includes(rawExt) ? rawExt : '.pdf';
    const fileUuid = randomUUID();

    let fileKey: string;
    if (input.document_type === DocumentType.CV) {
      fileKey = `tutors/${tutorId}/cv-${fileUuid}${ext}`;
    } else if (input.document_type === DocumentType.DEGREE_TRANSCRIPT) {
      fileKey = `tutors/${tutorId}/transcript-${fileUuid}${ext}`;
    } else if (input.document_type === DocumentType.SUBJECT_QUALIFICATION && input.variant_id) {
      fileKey = `tutors/${tutorId}/subject-proof/${input.variant_id}-${fileUuid}${ext}`;
    } else {
      fileKey = `tutors/${tutorId}/certificate-${fileUuid}${ext}`;
    }

    // Check if AWS S3 credentials are configured
    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    if (hasAwsCreds) {
      const s3Client = new S3Client({ region: env.AWS_REGION });
      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: fileKey,
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
      return { uploadUrl, fileKey };
    }

    // Local / Development mock presigned upload URL
    const uploadUrl = `http://localhost:${env.PORT}/api/documents/mock-s3-upload/${encodeURIComponent(fileKey)}`;
    return { uploadUrl, fileKey };
  },

  async confirmUpload(tutorId: string, input: ConfirmUploadInput) {
    const doc = await documentsRepository.createDocument({
      tutor_id: tutorId,
      document_type: input.document_type,
      variant_id: input.variant_id,
      file_key: input.file_key,
      file_size_kb: input.file_size_kb,
    });

    return { documentId: doc.id };
  },

  async deleteDocument(tutorId: string, documentId: string) {
    const doc = await documentsRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document not found.');
    }
    if (doc.tutor_id !== tutorId) {
      throw new ForbiddenError('You do not have permission to delete this document.');
    }

    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    if (hasAwsCreds) {
      try {
        const s3Client = new S3Client({ region: env.AWS_REGION });
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: doc.file_key,
          })
        );
      } catch (err) {
        console.error('Failed to delete S3 object:', err);
      }
    }

    await documentsRepository.deleteDocument(documentId, tutorId);
    return { success: true };
  },
};
