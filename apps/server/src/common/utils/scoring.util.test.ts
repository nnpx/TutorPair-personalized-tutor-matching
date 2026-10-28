import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DayOfWeek, LearningGoal, VerificationStatus } from '@tutorpair/shared';
import {
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
