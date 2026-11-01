import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tutorsService } from './tutors.service.js';
import { tutorsRepository } from './tutors.repository.js';
import { DayOfWeek, TutorType } from '@tutorpair/shared';
import { BadRequestError, NotFoundError, ConflictError } from '../../common/errors/http-errors.js';

describe('TutorsService Unit Tests', () => {
  it('should throw BadRequestError if start_time is greater than or equal to end_time', async () => {
    // Mock repository to return existing tutor profile
    const originalFind = tutorsRepository.findProfileByUserId;
    tutorsRepository.findProfileByUserId = async () => ({
      user_id: 'mock-user-id',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      line_id: null,
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

  it('should throw ConflictError if overlapping time slots are submitted for the same day', async () => {
    const originalFind = tutorsRepository.findProfileByUserId;
    tutorsRepository.findProfileByUserId = async () => ({
      user_id: 'mock-user-id',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      line_id: null,
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
                start_time: '09:00',
                end_time: '12:00',
              },
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '11:00', // Overlaps with 09:00-12:00
                end_time: '14:00',
              },
            ],
          });
        },
        ConflictError
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
      line_id: null,
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

  it('should return cv_url and unlocked details for confirmed student in getPublicTutorDetails', async () => {
    const origFindDetailed = tutorsRepository.findDetailedProfile;
    const origGetConfirmed = tutorsRepository.getStudentConfirmedMatchWithTutor;

    tutorsRepository.findDetailedProfile = async () => ({
      user_id: 'tutor-uuid',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      line_id: 'somchai_line',
      description: 'Expert math tutor',
      tutor_type: TutorType.INSTITUTIONAL,
      style_profile: [3, 4, 3, 2, 5],
      personality_profile: [3, 3, 4, 3],
      average_rating: '4.90',
      review_count: 12,
      verification_status: 'APPROVED',
      email: 'somchai@tutorpair.local',
      subjects: [
        {
          variant_id: 'var-1',
          subject_name: 'Mathematics',
          variant_name: 'School Math',
          category: 'EXACT_SCIENCES' as any,
          hourly_rate: '450.00',
          grade_levels: ['G10', 'G11'],
          teaching_focus: 'Calculus mastery',
        },
      ],
      cv_file_key: 'tutors/tutor-uuid/cv-123.pdf',
    } as any);

    tutorsRepository.getStudentConfirmedMatchWithTutor = async () => ({
      recommendation_id: 'rec-confirmed-uuid',
      has_reviewed: false,
    });

    try {
      const res = await tutorsService.getPublicTutorDetails('tutor-uuid', 'student-uuid', 'STUDENT');
      assert.equal(res.contact_unlocked, true);
      assert.equal(res.phone_number, '0812345678');
      assert.equal(res.confirmed_recommendation_id, 'rec-confirmed-uuid');
      assert.equal(res.has_reviewed, false);
      assert.ok(res.cv_url?.includes('mock-s3-view') || res.cv_url?.includes('s3'));
    } finally {
      tutorsRepository.findDetailedProfile = origFindDetailed;
      tutorsRepository.getStudentConfirmedMatchWithTutor = origGetConfirmed;
    }
  });

  it('should lock contact details and not allow review if student did not confirm this tutor', async () => {
    const origFindDetailed = tutorsRepository.findDetailedProfile;
    const origGetConfirmed = tutorsRepository.getStudentConfirmedMatchWithTutor;

    tutorsRepository.findDetailedProfile = async () => ({
      user_id: 'tutor-uuid',
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      line_id: 'somchai_line',
      description: 'Expert math tutor',
      tutor_type: TutorType.INSTITUTIONAL,
      style_profile: [3, 4, 3, 2, 5],
      personality_profile: [3, 3, 4, 3],
      average_rating: '4.90',
      review_count: 12,
      verification_status: 'APPROVED',
      email: 'somchai@tutorpair.local',
      subjects: [],
      cv_file_key: null,
    } as any);

    tutorsRepository.getStudentConfirmedMatchWithTutor = async () => null;

    try {
      const res = await tutorsService.getPublicTutorDetails('tutor-uuid', 'unconfirmed-student-uuid', 'STUDENT');
      assert.equal(res.contact_unlocked, false);
      assert.equal(res.phone_number, null);
      assert.equal(res.line_id, null);
      assert.equal(res.confirmed_recommendation_id, null);
      assert.equal(res.cv_url, null);
    } finally {
      tutorsRepository.findDetailedProfile = origFindDetailed;
      tutorsRepository.getStudentConfirmedMatchWithTutor = origGetConfirmed;
    }
  });
});
