import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { documentsService } from './documents.service.js';
import { documentsRepository } from './documents.repository.js';
import { DocumentType } from '@tutorpair/shared';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/http-errors.js';

describe('DocumentsService Unit Tests', () => {
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
