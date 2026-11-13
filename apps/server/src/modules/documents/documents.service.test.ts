import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { documentsService, documentObjectStore } from './documents.service.js';
import { documentsRepository } from './documents.repository.js';
import { env } from '../../config/env.js';
import { DocumentType } from '@tutorpair/shared';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/http-errors.js';

describe('DocumentsService Unit Tests', () => {
  const tutorId = '11111111-1111-4111-8111-111111111111';
  const fileKey = `tutors/${tutorId}/cv-22222222-2222-4222-8222-222222222222.pdf`;

  it('rejects a different tutor key before saving document metadata', async () => {
    await assert.rejects(() => documentsService.confirmUpload(tutorId, {
      file_key: fileKey.replace(tutorId, '33333333-3333-4333-8333-333333333333'),
      file_size_kb: 1,
      document_type: DocumentType.CV,
    }), BadRequestError);
  });

  it('uses the S3 object size and rejects a mismatched claim', async () => {
    const originalMode = env.NODE_ENV;
    const originalHead = documentObjectStore.head;
    const originalCreate = documentsRepository.createDocumentWithinQuota;
    let savedSize: number | null = null;
    (env as { NODE_ENV: string }).NODE_ENV = 'production';
    documentObjectStore.head = async () => ({ ContentLength: 1500 }) as any;
    documentsRepository.createDocumentWithinQuota = async (data) => {
      savedSize = data.file_size_kb;
      return { id: 'verified-document' } as any;
    };
    try {
      await assert.rejects(() => documentsService.confirmUpload(tutorId, {
        file_key: fileKey,
        file_size_kb: 1,
        document_type: DocumentType.CV,
      }), BadRequestError);
      assert.equal(savedSize, null);
      const result = await documentsService.confirmUpload(tutorId, {
        file_key: fileKey,
        file_size_kb: 2,
        document_type: DocumentType.CV,
      });
      assert.equal(result.documentId, 'verified-document');
      assert.equal(savedSize, 2);
    } finally {
      (env as { NODE_ENV: string }).NODE_ENV = originalMode;
      documentObjectStore.head = originalHead;
      documentsRepository.createDocumentWithinQuota = originalCreate;
    }
  });
  it('should throw BadRequestError if upload file exceeds 10MB', async () => {
    await assert.rejects(
      async () => {
        await documentsService.generatePresignedUploadUrl('tutor-1', {
          file_name: 'huge.pdf',
          file_size_kb: 10241, // 10MB + 1KB
          document_type: DocumentType.CV,
        });
      },
      BadRequestError
    );
  });

  it('should throw BadRequestError if SUBJECT_QUALIFICATION document has no variant_id', async () => {
    const originalGetStorage = documentsRepository.getTotalStorageKb;
    documentsRepository.getTotalStorageKb = async () => 0;

    try {
      await assert.rejects(
        async () => {
          await documentsService.generatePresignedUploadUrl('tutor-1', {
            file_name: 'proof.pdf',
            file_size_kb: 500,
            document_type: DocumentType.SUBJECT_QUALIFICATION,
            variant_id: null,
          });
        },
        BadRequestError
      );
    } finally {
      documentsRepository.getTotalStorageKb = originalGetStorage;
    }
  });

  it('should throw NotFoundError if deleting non-existent document', async () => {
    const originalFindById = documentsRepository.findById;
    documentsRepository.findById = async () => null;

    try {
      await assert.rejects(
        async () => {
          await documentsService.deleteDocument('tutor-1', 'non-existent-doc');
        },
        NotFoundError
      );
    } finally {
      documentsRepository.findById = originalFindById;
    }
  });

  it('should throw ForbiddenError if deleting another tutor document', async () => {
    const originalFindById = documentsRepository.findById;
    documentsRepository.findById = async () => ({
      id: 'doc-123',
      tutor_id: 'tutor-other',
      document_type: DocumentType.CV,
      variant_id: null,
      file_key: 'tutors/tutor-other/cv.pdf',
      file_size_kb: 500,
      uploaded_at: new Date(),
    });

    try {
      await assert.rejects(
        async () => {
          await documentsService.deleteDocument('tutor-1', 'doc-123');
        },
        ForbiddenError
      );
    } finally {
      documentsRepository.findById = originalFindById;
    }
  });
});
