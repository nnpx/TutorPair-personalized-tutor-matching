import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { studentsService } from './students.service.js';
import { studentsRepository } from './students.repository.js';
import { DayOfWeek, TutorTypePref } from '@tutorpair/shared';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
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

  it('should throw UnauthorizedError if userId is empty on getProfile', async () => {
    await assert.rejects(async () => {
      await studentsService.getProfile('');
    }, UnauthorizedError);
  });

  it('should throw BadRequestError if grade_level is invalid on createProfile', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            grade_level: 'G13', // Invalid grade
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2, 4, 3],
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

  it('should throw BadRequestError if style_profile ratings are out of 1-5 range', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 6, 2, 4, 3], // 6 is invalid
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

  it('should throw BadRequestError if personality_profile ratings are out of 1-5 range', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(
        async () => {
          await studentsService.createProfile('mock-student-id', {
            first_name: 'Pitchaya',
            last_name: 'Siriwong',
            phone_number: '0891234567',
            grade_level: 'G10',
            tutor_type_pref: TutorTypePref.ANY,
            style_profile: [3, 4, 2, 4, 3],
            personality_profile: [0, 5, 3, 4], // 0 is invalid
            budget_max: 650,
          });
        },
        BadRequestError
      );
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if updateProfile payload is empty', async () => {
    await assert.rejects(async () => {
      await studentsService.updateProfile('mock-student-id', {});
    }, BadRequestError);
  });

  it('should throw NotFoundError if updateProfile student does not exist', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => null;

    try {
      await assert.rejects(async () => {
        await studentsService.updateProfile('mock-student-id', { first_name: 'NewName' });
      }, NotFoundError);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if availability slot is missing required fields', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(
        async () => {
          await studentsService.setAvailability('mock-student-id', {
            availability: [
              {
                day_of_week: DayOfWeek.MONDAY,
                start_time: '',
                end_time: '19:00',
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

  it('should accept availability passed as { slots: [...] }', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    const originalReplace = studentsRepository.replaceAvailability;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    let savedSlots: any = null;
    studentsRepository.replaceAvailability = async (_userId, slots) => {
      savedSlots = slots;
      return slots as any;
    };

    try {
      await studentsService.setAvailability('mock-student-id', {
        slots: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '10:00',
            end_time: '12:00',
          },
        ],
      } as any);
      assert.equal(savedSlots.length, 1);
      assert.equal(savedSlots[0].day_of_week, DayOfWeek.MONDAY);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
      studentsRepository.replaceAvailability = originalReplace;
    }
  });

  it('should throw BadRequestError if empty variant_ids are submitted in setSubjects', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(async () => {
        await studentsService.setSubjects('mock-student-id', []);
      }, BadRequestError);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw BadRequestError if duplicate subject variants are submitted in setSubjects', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    studentsRepository.findProfileByUserId = async () => mockStudent;

    try {
      await assert.rejects(async () => {
        await studentsService.setSubjects('mock-student-id', [
          '3a1b2c4d-0001-4000-8000-111122223333',
          '3a1b2c4d-0001-4000-8000-111122223333',
        ]);
      }, BadRequestError);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
    }
  });

  it('should throw NotFoundError if subject variant does not exist in database on setSubjects', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    const originalVerify = studentsRepository.verifyVariantIdsExist;
    studentsRepository.findProfileByUserId = async () => mockStudent;
    studentsRepository.verifyVariantIdsExist = async () => []; // None found

    try {
      await assert.rejects(async () => {
        await studentsService.setSubjects('mock-student-id', [
          '3a1b2c4d-0001-4000-8000-111122223333',
        ]);
      }, NotFoundError);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
      studentsRepository.verifyVariantIdsExist = originalVerify;
    }
  });

  it('should successfully set subjects when variants exist and are unique', async () => {
    const originalFind = studentsRepository.findProfileByUserId;
    const originalVerify = studentsRepository.verifyVariantIdsExist;
    const originalReplace = studentsRepository.replaceSubjects;
    studentsRepository.findProfileByUserId = async () => mockStudent;
    studentsRepository.verifyVariantIdsExist = async (ids) => ids;

    const mockSubjectsResult = [
      {
        variant_id: '3a1b2c4d-0001-4000-8000-111122223333',
        subject_name: 'Mathematics',
        variant_name: 'School Curriculum Mathematics',
        category: 'GENERAL_LEARNING' as any,
        learning_goal: 'SCHOOL_CURRICULUM' as any,
      },
    ];
    studentsRepository.replaceSubjects = async () => mockSubjectsResult;

    try {
      const result = await studentsService.setSubjects('mock-student-id', [
        '3a1b2c4d-0001-4000-8000-111122223333',
      ]);
      assert.deepEqual(result, mockSubjectsResult);
    } finally {
      studentsRepository.findProfileByUserId = originalFind;
      studentsRepository.verifyVariantIdsExist = originalVerify;
      studentsRepository.replaceSubjects = originalReplace;
    }
  });
});
