import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adminService } from './admin.service.js';
import { adminRepository } from './admin.repository.js';
import { VerificationStatus, TutorType } from '@tutorpair/shared';
import { NotFoundError, BadRequestError } from '../../common/errors/http-errors.js';

describe('AdminService Unit Tests', () => {
  it('should throw NotFoundError if tutor details requested for non-existent tutor', async () => {
    const originalFind = adminRepository.findTutorById;
    adminRepository.findTutorById = async () => null;

    try {
      await assert.rejects(
        async () => {
          await adminService.getTutorDetails('00000000-0000-0000-0000-000000000000');
        },
        NotFoundError
      );
    } finally {
      adminRepository.findTutorById = originalFind;
    }
  });

  it('should throw BadRequestError if rejecting a tutor without rejection reason', async () => {
    const originalFind = adminRepository.findTutorById;
    adminRepository.findTutorById = async () => ({
      user_id: 'tutor-1',
      email: 'tutor1@test.com',
      first_name: 'Test',
      last_name: 'Tutor',
      phone_number: '0812345678',
      description: null,
      tutor_type: TutorType.FREELANCE,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      hourly_rate: 500,
      verification_status: VerificationStatus.PENDING,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      subjects: [],
      documents: [],
    });

    try {
      await assert.rejects(
        async () => {
          await adminService.verifyTutor('tutor-1', {
            status: VerificationStatus.REJECTED,
            rejection_reason: '   ', // whitespace only
          });
        },
        BadRequestError
      );
    } finally {
      adminRepository.findTutorById = originalFind;
    }
  });

  it('should throw NotFoundError if viewing a document that does not exist', async () => {
    const originalFindDoc = adminRepository.findDocumentById;
    adminRepository.findDocumentById = async () => null;

    try {
      await assert.rejects(
        async () => {
          await adminService.getDocumentViewUrl('tutor-1', 'doc-1');
        },
        NotFoundError
      );
    } finally {
      adminRepository.findDocumentById = originalFindDoc;
    }
  });
});
