import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DayOfWeek,
  LearningGoal,
  TutorType,
  TutorTypePref,
  VerificationStatus,
} from '@tutorpair/shared';
import { BadRequestError } from '../errors/http-errors.js';
import {
  calculateCompatibilityScore,
  TUTOR_TYPE_MISMATCH_PENALTY,
  hasAvailabilityOverlap,
  passesHardFilters,
  MIN_OVERLAP_MINUTES,
  type HardFilterTutor,
  type HardFilterStudent,
  type HardFilterVariant,
} from './scoring.util.js';

const slot = (day: DayOfWeek, start: string, end: string) => ({
  day_of_week: day,
  start_time: start,
  end_time: end,
});

const MON = DayOfWeek.MONDAY;
const TUE = DayOfWeek.TUESDAY;

describe('hasAvailabilityOverlap (TP-6 availability gate)', () => {
  it('uses a 60 minute minimum overlap', () => {
    assert.equal(MIN_OVERLAP_MINUTES, 60);
  });

  it('keeps a partial overlap of at least 60 minutes', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '17:00', '19:00')], [slot(MON, '18:00', '20:00')]),
      true
    );
  });

  it('keeps a slot fully contained in the other', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '09:00', '18:00')], [slot(MON, '10:00', '12:00')]),
      true
    );
  });

  it('eliminates slots that only touch at an endpoint', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '16:00', '17:00')], [slot(MON, '17:00', '18:00')]),
      false
    );
  });

  it('eliminates an overlap shorter than the minimum', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '17:00', '18:30')], [slot(MON, '18:00', '20:00')]),
      false
    );
  });

  it('eliminates the same hours on a different day', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '17:00', '19:00')], [slot(TUE, '17:00', '19:00')]),
      false
    );
  });

  it('eliminates when either side has no slots', () => {
    assert.equal(hasAvailabilityOverlap([], [slot(MON, '17:00', '19:00')]), false);
    assert.equal(hasAvailabilityOverlap([slot(MON, '17:00', '19:00')], []), false);
  });

  it('compares HH:mm against HH:MM:SS correctly', () => {
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '17:00', '19:00')], [slot(MON, '18:00:00', '20:00:00')]),
      true
    );
    assert.equal(
      hasAvailabilityOverlap([slot(MON, '16:00', '17:00')], [slot(MON, '17:00:00', '18:00:00')]),
      false
    );
  });

  it('finds the one overlapping pair among many slots', () => {
    assert.equal(
      hasAvailabilityOverlap(
        [slot(MON, '08:00', '09:00'), slot(TUE, '10:00', '12:00')],
        [slot(MON, '13:00', '15:00'), slot(TUE, '11:00', '14:00')]
      ),
      true
    );
  });
});

describe('passesHardFilters (TP-6 stage 1)', () => {
  const MATH_PRIMARY = 'variant-math-primary';
  const SCIENCE = 'variant-science';

  const curriculum: HardFilterVariant = {
    id: MATH_PRIMARY,
    learning_goal: LearningGoal.SCHOOL_CURRICULUM,
  };
  const exam: HardFilterVariant = {
    id: 'variant-ielts',
    learning_goal: LearningGoal.STANDARDIZED_EXAMS,
  };

  const student: HardFilterStudent = {
    grade_level: 'G6',
    availabilities: [slot(MON, '17:00', '19:00')],
  };

  const tutor = (over: Partial<HardFilterTutor> = {}): HardFilterTutor => ({
    verification_status: VerificationStatus.APPROVED,
    variant_id: MATH_PRIMARY,
    grade_levels: ['G4', 'G5', 'G6'],
    availabilities: [slot(MON, '18:00', '20:00')],
    ...over,
  });

  it('keeps a tutor who passes every gate', () => {
    assert.equal(passesHardFilters(tutor(), student, curriculum), true);
  });

  it('eliminates a PENDING tutor', () => {
    assert.equal(
      passesHardFilters(tutor({ verification_status: VerificationStatus.PENDING }), student, curriculum),
      false
    );
  });

  it('eliminates a REJECTED tutor', () => {
    assert.equal(
      passesHardFilters(tutor({ verification_status: VerificationStatus.REJECTED }), student, curriculum),
      false
    );
  });

  it('eliminates a tutor who teaches a different subject (Math requested, Science taught)', () => {
    assert.equal(passesHardFilters(tutor({ variant_id: SCIENCE }), student, curriculum), false);
  });

  it('eliminates a G12-only tutor for a G6 student on a curriculum variant', () => {
    assert.equal(
      passesHardFilters(tutor({ grade_levels: ['G12'] }), student, curriculum),
      false
    );
  });

  it('keeps a G12-only tutor for a G6 student on a non-curriculum variant', () => {
    assert.equal(
      passesHardFilters(tutor({ variant_id: exam.id, grade_levels: ['G12'] }), student, exam),
      true
    );
  });

  it('eliminates a curriculum tutor with null or empty grade levels', () => {
    assert.equal(passesHardFilters(tutor({ grade_levels: null }), student, curriculum), false);
    assert.equal(passesHardFilters(tutor({ grade_levels: [] }), student, curriculum), false);
  });

  it('keeps a non-curriculum tutor with null grade levels', () => {
    assert.equal(
      passesHardFilters(tutor({ variant_id: exam.id, grade_levels: null }), student, exam),
      true
    );
  });

  it('eliminates a tutor with no overlapping slot', () => {
    assert.equal(
      passesHardFilters(
        tutor({ availabilities: [slot(TUE, '18:00', '20:00')] }),
        student,
        curriculum
      ),
      false
    );
  });

  it('keeps a tutor whose slot only partially overlaps (60 minutes)', () => {
    assert.equal(
      passesHardFilters(
        tutor({ availabilities: [slot(MON, '18:00', '20:00')] }),
        student,
        curriculum
      ),
      true
    );
  });
});

describe('calculateCompatibilityScore (TP-7 stage 2)', () => {
  const SAME_STYLE = [3, 3, 3, 3, 3];
  const SAME_PERSONALITY = [2, 2, 2, 2];

  // Base case from SPEC: identical sliders, rate == budget (500), type matches.
  const base = {
    studentStyle: SAME_STYLE,
    tutorStyle: SAME_STYLE,
    studentPersonality: SAME_PERSONALITY,
    tutorPersonality: SAME_PERSONALITY,
    studentBudget: 500,
    tutorRate: 500,
    tutorTypePref: TutorTypePref.FREELANCE,
    tutorType: TutorType.FREELANCE,
  };

  it('uses a 10 point tutor-type mismatch penalty', () => {
    assert.equal(TUTOR_TYPE_MISMATCH_PENALTY, 10);
  });

  describe('SPEC worked numbers (budget 500)', () => {
    it('A: identical sliders, rate == budget -> 90', () => {
      assert.equal(calculateCompatibilityScore(base), 90);
    });

    it('B: identical sliders, half price -> 95', () => {
      assert.equal(calculateCompatibilityScore({ ...base, tutorRate: 250 }), 95);
    });

    it('C: identical sliders, 1 baht over budget -> 80', () => {
      assert.equal(calculateCompatibilityScore({ ...base, tutorRate: 501 }), 80);
    });

    it('D: every slider off by 1 -> 70', () => {
      assert.equal(
        calculateCompatibilityScore({
          ...base,
          tutorStyle: [4, 4, 4, 4, 4],
          tutorPersonality: [3, 3, 3, 3],
        }),
        70
      );
    });

    it('E: tutor type mismatch -> 80', () => {
      assert.equal(
        calculateCompatibilityScore({ ...base, tutorType: TutorType.UNDERGRADUATE }),
        80
      );
    });
  });

  describe('distance', () => {
    it('identical vectors give full style and personality points (free tutor, budget 500 -> 100)', () => {
      assert.equal(calculateCompatibilityScore({ ...base, tutorRate: 0 }), 100);
    });

    it('maximum distance gives zero style and personality points (only budget remains)', () => {
      assert.equal(
        calculateCompatibilityScore({
          ...base,
          studentStyle: [1, 1, 1, 1, 1],
          tutorStyle: [5, 5, 5, 5, 5],
          studentPersonality: [1, 1, 1, 1],
          tutorPersonality: [5, 5, 5, 5],
        }),
        10
      );
    });

    it('is symmetric in student and tutor sliders', () => {
      const a = calculateCompatibilityScore({
        ...base,
        studentStyle: [1, 2, 3, 4, 5],
        tutorStyle: [5, 4, 3, 2, 1],
      });
      const b = calculateCompatibilityScore({
        ...base,
        studentStyle: [5, 4, 3, 2, 1],
        tutorStyle: [1, 2, 3, 4, 5],
      });
      assert.equal(a, b);
    });
  });

  describe('slider validation', () => {
    const bad: Array<[string, Partial<typeof base>]> = [
      ['student style too short', { studentStyle: [3, 3, 3, 3] }],
      ['student style too long', { studentStyle: [3, 3, 3, 3, 3, 3] }],
      ['tutor style too short', { tutorStyle: [3, 3, 3, 3] }],
      ['student personality too long', { studentPersonality: [2, 2, 2, 2, 2] }],
      ['tutor personality too short', { tutorPersonality: [2, 2, 2] }],
      ['value below range (0)', { studentStyle: [0, 3, 3, 3, 3] }],
      ['value above range (6)', { tutorStyle: [3, 3, 3, 3, 6] }],
      ['non-integer value (2.5)', { studentPersonality: [2, 2.5, 2, 2] }],
      ['NaN value', { tutorPersonality: [2, NaN, 2, 2] }],
    ];

    for (const [name, override] of bad) {
      it(`throws BadRequestError: ${name}`, () => {
        assert.throws(() => calculateCompatibilityScore({ ...base, ...override }), BadRequestError);
      });
    }
  });

  describe('budget', () => {
    it('rate below budget scores higher than rate at budget', () => {
      assert.ok(
        calculateCompatibilityScore({ ...base, tutorRate: 400 }) >
          calculateCompatibilityScore({ ...base, tutorRate: 500 })
      );
    });

    it('free tutor gets the full budget points', () => {
      assert.equal(calculateCompatibilityScore({ ...base, tutorRate: 0 }), 100);
    });

    it('any rate over budget gets zero budget points', () => {
      assert.equal(calculateCompatibilityScore({ ...base, tutorRate: 5000 }), 80);
    });
  });

  describe('tutor-type modifier', () => {
    it('ANY never penalizes', () => {
      for (const tutorType of Object.values(TutorType)) {
        assert.equal(
          calculateCompatibilityScore({ ...base, tutorTypePref: TutorTypePref.ANY, tutorType }),
          90
        );
      }
    });

    it('exact match is not penalized', () => {
      assert.equal(calculateCompatibilityScore(base), 90);
    });

    it('mismatch subtracts exactly the penalty', () => {
      assert.equal(
        calculateCompatibilityScore({ ...base, tutorType: TutorType.INSTITUTIONAL }),
        90 - TUTOR_TYPE_MISMATCH_PENALTY
      );
    });

    it('clamps at 0 and never goes negative', () => {
      const score = calculateCompatibilityScore({
        ...base,
        studentStyle: [1, 1, 1, 1, 1],
        tutorStyle: [5, 5, 5, 5, 5],
        studentPersonality: [1, 1, 1, 1],
        tutorPersonality: [5, 5, 5, 5],
        tutorRate: 5000,
        tutorType: TutorType.UNDERGRADUATE,
      });
      assert.equal(score, 0);
    });
  });

  describe('determinism and range', () => {
    it('same input always gives the same output', () => {
      const input = {
        ...base,
        studentStyle: [1, 4, 2, 5, 3],
        tutorStyle: [2, 4, 1, 3, 3],
        tutorRate: 333,
      };
      const first = calculateCompatibilityScore(input);
      for (let i = 0; i < 50; i++) assert.equal(calculateCompatibilityScore(input), first);
    });

    it('does not mutate its inputs', () => {
      const studentStyle = [1, 2, 3, 4, 5];
      calculateCompatibilityScore({ ...base, studentStyle });
      assert.deepEqual(studentStyle, [1, 2, 3, 4, 5]);
    });

    it('is rounded to 2 decimals and stays within 0-100', () => {
      const score = calculateCompatibilityScore({
        ...base,
        studentStyle: [1, 4, 2, 5, 3],
        tutorStyle: [2, 4, 1, 3, 3],
        tutorRate: 333,
      });
      assert.ok(score >= 0 && score <= 100);
      assert.equal(score, Math.round(score * 100) / 100);
    });
  });
});
