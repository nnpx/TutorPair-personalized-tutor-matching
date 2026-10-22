import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tutorsService } from './tutors.service.js';
import { tutorsRepository } from './tutors.repository.js';
import { DayOfWeek, TutorType } from '@tutorpair/shared';
import { BadRequestError, NotFoundError } from '../../common/errors/http-errors.js';

describe('TutorsService Unit Tests', () => {
  it('should throw BadRequestError if start_time is greater than or equal to end_time', async () => {
    // Mock repository to return existing tutor profile
    const originalFind = tutorsRepository.findProfileByUserId;
    tutorsRepository.findProfileByUserId = async () => ({
      user_id: 'mock-user-id',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      description: null,
      tutor_type: TutorType.UNDERGRADUATE,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      verification_status: 'APPROVED',
      rejection_reason: null,
      average_rating: '0.00',
      review_count: 0,
    });

    try {
      await assert.rejects(
        async () => {
          await tutorsService.setAvailability('mock-user-id', {
            availability: [
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '18:00',
                end_time: '17:00', // Invalid: end earlier than start
              },
            ],
          });
        },
        BadRequestError
      );
    } finally {
      tutorsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if duplicate variants are submitted in setSubjects', async () => {
    const originalFind = tutorsRepository.findProfileByUserId;
    tutorsRepository.findProfileByUserId = async () => ({
      user_id: 'mock-user-id',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      description: null,
      tutor_type: TutorType.UNDERGRADUATE,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      verification_status: 'APPROVED',
      rejection_reason: null,
      average_rating: '0.00',
      review_count: 0,
    });

    try {
      await assert.rejects(
        async () => {
          await tutorsService.setSubjects('mock-user-id', {
            subjects: [
              { variant_id: '11111111-1111-1111-1111-111111111111', hourly_rate: 500 },
              { variant_id: '11111111-1111-1111-1111-111111111111', hourly_rate: 500 }, // Duplicate
            ],
          });
        },
        BadRequestError
      );
    } finally {
      tutorsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw NotFoundError if profile is not found when fetching subjects', async () => {
    const originalFind = tutorsRepository.findProfileByUserId;
    tutorsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await tutorsService.getSubjects('non-existent-id');
        },
        NotFoundError
      );
    } finally {
      tutorsRepository.findProfileByUserId = originalFind;
    }
  });
});
