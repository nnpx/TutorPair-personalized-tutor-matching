import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { studentsService } from './students.service.js';
import { studentsRepository } from './students.repository.js';
import { DayOfWeek, TutorTypePref } from '@tutorpair/shared';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../common/errors/http-errors.js';

describe('StudentsService Unit Tests', () => {
  const mockStudent = {
    user_id: 'mock-student-id',
    email: 'student@test.com',
    first_name: 'Pitchaya',
    last_name: 'Siriwong',
    phone_number: '0891234567',
    line_id: 'pitchaya.s',
    grade_level: 'G10',
    tutor_type_pref: TutorTypePref.ANY,
    style_profile: [3, 4, 2, 4, 3],
    personality_profile: [4, 5, 3, 4],
    budget_max: 650,
  };

  it('should throw NotFoundError if student profile is not found', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.getProfile('non-existent-student');
        },
        NotFoundError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw ConflictError if student profile already exists on createProfile', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            line_id: 'pitchaya.s',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2, 4, 3],
            personality_profile: [4, 5, 3, 4],
            budget_max: 650,
          });
        },
        ConflictError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if style_profile does not have exactly 5 ratings', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            line_id: 'pitchaya.s',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2], // Only 3 instead of 5
            personality_profile: [4, 5, 3, 4],
            budget_max: 650,
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if personality_profile does not have exactly 4 ratings', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            line_id: 'pitchaya.s',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2, 4, 3],
            personality_profile: [4, 5], // Only 2 instead of 4
            budget_max: 650,
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if budget_max is less than or equal to 0', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            line_id: 'pitchaya.s',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2, 4, 3],
            personality_profile: [4, 5, 3, 4],
            budget_max: 0, // Invalid budget
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if start_time is greater than or equal to end_time', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(
        async () => {
          await studentsService.setAvailability('mock-student-id', {
            availability: [
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '19:00',
                end_time: '17:00', // Invalid: end before start
              },
            ],
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if availability slots overlap on the same day', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(
        async () => {
          await studentsService.setAvailability('mock-student-id', {
            availability: [
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '17:00',
                end_time: '19:00',
              },
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '18:00', // Overlaps with 17:00-19:00
                end_time: '20:00',
              },
            ],
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should successfully get student profile', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      const profile = await studentsService.getProfile('mock-student-id');
      assert.deepEqual(profile, mockStudent);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should successfully create student profile without optional line_id', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    const originalCreate = studentsRepository.createProfile;
    studentsRepository.findProfileByUserId = async () => null;

    let createdInput: any = null;
    studentsRepository.createProfile = async (userId, input) => {
      createdInput = input;
      return {
        ...mockStudent,
        user_id: userId,
        line_id: null,
      };
    };

    try {
      const res = await studentsService.createProfile('mock-student-id', {
        first_name: 'Pitchaya',
        last_name: 'Siriwong',
        phone_number: '0891234567',
        grade_level: 'G10',
        tutor_type_pref: TutorTypePref.ANY,
        style_profile: [3, 4, 2, 4, 3],
        personality_profile: [4, 5, 3, 4],
        budget_max: 650,
      });
      assert.equal(res.line_id, null);
      assert.equal(createdInput.line_id, undefined);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
      studentsRepository.createProfile = originalCreate;
    }
  });
});
