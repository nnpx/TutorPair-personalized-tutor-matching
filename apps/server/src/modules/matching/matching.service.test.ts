import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DayOfWeek,
  LearningGoal,
  MatchRequestStatus,
  TutorType,
  TutorTypePref,
  VerificationStatus,
} from '@tutorpair/shared';
import { matchingService } from './matching.service.js';
import { matchingRepository, type CandidateTutor } from './matching.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../common/errors/http-errors.js';

const STUDENT_ID = 'student-1';
const VARIANT_ID = 'variant-math-primary';

const slot = (day: DayOfWeek, start: string, end: string) => ({
  id: 'slot',
  day_of_week: day,
  start_time: start,
  end_time: end,
});

const student = (over: Record<string, unknown> = {}) =>
  ({
    user_id: STUDENT_ID,
    email: 's@test',
    first_name: 'Nok',
    last_name: 'Student',
    phone_number: '0899999999',
    line_id: 'nok.line',
    grade_level: 'G6',
    tutor_type_pref: TutorTypePref.ANY,
    style_profile: [3, 3, 3, 3, 3],
    personality_profile: [3, 3, 3, 3],
    budget_max: 500,
    availabilities: [slot(DayOfWeek.MONDAY, '17:00', '19:00')],
    ...over,
  }) as Awaited<ReturnType<typeof studentsRepository.getProfileWithAvailability>>;

const tutor = (id: string, over: Partial<CandidateTutor> = {}): CandidateTutor => ({
  tutor_id: id,
  first_name: `First-${id}`,
  last_name: `Last-${id}`,
  description: `About ${id}`,
  tutor_type: TutorType.FREELANCE,
  average_rating: 4.5,
  review_count: 12,
  verification_status: VerificationStatus.APPROVED,
  style_profile: [3, 3, 3, 3, 3],
  personality_profile: [3, 3, 3, 3],
  variant_id: VARIANT_ID,
  hourly_rate: 400,
  grade_levels: ['G5', 'G6'],
  teaching_focus: 'Kangaroo Math',
  availabilities: [{ day_of_week: DayOfWeek.MONDAY, start_time: '18:00:00', end_time: '20:00:00' }],
  ...over,
});

describe('MatchingService.findTop3 (TP-8)', () => {
  const orig = {
    profile: studentsRepository.getProfileWithAvailability,
    variant: matchingRepository.findVariantById,
    candidates: matchingRepository.findCandidateTutors,
    create: matchingRepository.createRequestWithRecommendations,
  };

  let saved: {
    studentId: string;
    variantId: string;
    recs: Array<{ tutor_id: string; rank: number; score: number }>;
  } | null;

  beforeEach(() => {
    saved = null;
    studentsRepository.getProfileWithAvailability = async () => student();
    matchingRepository.findVariantById = async () => ({
      id: VARIANT_ID,
      learning_goal: LearningGoal.SCHOOL_CURRICULUM,
    });
    matchingRepository.findCandidateTutors = async () => [];
    matchingRepository.createRequestWithRecommendations = async (studentId, variantId, recs) => {
      saved = { studentId, variantId, recs };
      return {
        match_request_id: 'req-1',
        recommendations: recs.map((r) => ({ ...r, recommendation_id: `rec-${r.tutor_id}` })),
      };
    };
  });

  afterEach(() => {
    studentsRepository.getProfileWithAvailability = orig.profile;
    matchingRepository.findVariantById = orig.variant;
    matchingRepository.findCandidateTutors = orig.candidates;
    matchingRepository.createRequestWithRecommendations = orig.create;
  });

  it('throws NotFoundError when the student has no profile', async () => {
    studentsRepository.getProfileWithAvailability = async () => null;
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      NotFoundError
    );
    assert.equal(saved, null);
  });

  it('throws NotFoundError for an unknown variant', async () => {
    matchingRepository.findVariantById = async () => null;
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      NotFoundError
    );
    assert.equal(saved, null);
  });

  it('throws UnprocessableEntityError with a clear message when the student has no availability', async () => {
    studentsRepository.getProfileWithAvailability = async () => student({ availabilities: [] });
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      (err: unknown) =>
        err instanceof UnprocessableEntityError && /availability/i.test((err as Error).message)
    );
    assert.equal(saved, null);
  });

  it('returns an empty list (not an error) and still records the request when nobody survives', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('t1', { verification_status: VerificationStatus.PENDING }),
      tutor('t2', { grade_levels: ['G12'] }),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(result.recommendations, []);
    assert.equal(result.match_request_id, 'req-1');
    assert.equal(result.status, MatchRequestStatus.PENDING);
    assert.deepEqual(saved?.recs, []);
  });

  it('applies the hard filters before scoring', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('ok'),
      tutor('wrong-variant', { variant_id: 'variant-science' }),
      tutor('no-overlap', {
        availabilities: [
          { day_of_week: DayOfWeek.TUESDAY, start_time: '18:00', end_time: '20:00' },
        ],
      }),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(
      result.recommendations.map((r) => r.tutor.tutor_id),
      ['ok']
    );
  });

  it('keeps only the Top 3 of 5 survivors, ranked 1..3 by score', async () => {
    // Student budget 500; with identical sliders a cheaper tutor scores higher.
    matchingRepository.findCandidateTutors = async () => [
      tutor('t-450', { hourly_rate: 450 }),
      tutor('t-100', { hourly_rate: 100 }),
      tutor('t-300', { hourly_rate: 300 }),
      tutor('t-500', { hourly_rate: 500 }),
      tutor('t-200', { hourly_rate: 200 }),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(
      result.recommendations.map((r) => [r.rank, r.tutor.tutor_id]),
      [
        [1, 't-100'],
        [2, 't-200'],
        [3, 't-300'],
      ]
    );
    assert.deepEqual(
      saved?.recs.map((r) => r.rank),
      [1, 2, 3]
    );
  });

  it('returns what exists when fewer than 3 survive', async () => {
    matchingRepository.findCandidateTutors = async () => [tutor('a'), tutor('b')];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.equal(result.recommendations.length, 2);
  });

  it('orders equal scores by tutor_id regardless of the order the DB returned them', async () => {
    matchingRepository.findCandidateTutors = async () => [tutor('c'), tutor('a'), tutor('b')];
    const first = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    matchingRepository.findCandidateTutors = async () => [tutor('b'), tutor('c'), tutor('a')];
    const second = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(
      first.recommendations.map((r) => r.tutor.tutor_id),
      ['a', 'b', 'c']
    );
    assert.deepEqual(second, first);
  });

  it('applies the tutor-type preference from the stored profile', async () => {
    studentsRepository.getProfileWithAvailability = async () =>
      student({ tutor_type_pref: TutorTypePref.UNDERGRADUATE });
    matchingRepository.findCandidateTutors = async () => [
      tutor('freelance', { tutor_type: TutorType.FREELANCE }),
      tutor('undergrad', { tutor_type: TutorType.UNDERGRADUATE }),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.equal(result.recommendations[0].tutor.tutor_id, 'undergrad');
    assert.equal(result.recommendations[0].score - result.recommendations[1].score, 10);
  });

  it('persists the request for this student and variant with the ranked scores', async () => {
    matchingRepository.findCandidateTutors = async () => [tutor('a')];
    await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.equal(saved?.studentId, STUDENT_ID);
    assert.equal(saved?.variantId, VARIANT_ID);
    assert.equal(saved?.recs[0].tutor_id, 'a');
    assert.equal(typeof saved?.recs[0].score, 'number');
  });

  it('returns only public tutor fields (no contact, verification or slider data)', async () => {
    matchingRepository.findCandidateTutors = async () => [tutor('a')];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    const rec = result.recommendations[0];
    assert.deepEqual(Object.keys(rec.tutor).sort(), [
      'average_rating',
      'description',
      'first_name',
      'hourly_rate',
      'last_name',
      'review_count',
      'teaching_focus',
      'tutor_id',
      'tutor_type',
    ]);
    assert.equal(rec.recommendation_id, 'rec-a');
    assert.equal(rec.tutor.hourly_rate, 400);
    const json = JSON.stringify(result);
    for (const forbidden of [
      'phone_number',
      'line_id',
      'rejection_reason',
      'verification_status',
      'file_key',
    ]) {
      assert.equal(json.includes(forbidden), false, `${forbidden} leaked`);
    }
  });

  it('is deterministic: the same input gives the same output', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('a', { hourly_rate: 123 }),
      tutor('b', { hourly_rate: 321, style_profile: [1, 2, 3, 4, 5] }),
    ];
    const first = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    const second = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(first, second);
  });
});

describe('MatchingService.findTop3: error handling for bad data and races', () => {
  const orig = {
    profile: studentsRepository.getProfileWithAvailability,
    variant: matchingRepository.findVariantById,
    candidates: matchingRepository.findCandidateTutors,
    create: matchingRepository.createRequestWithRecommendations,
    warn: console.warn,
  };
  let warnings: unknown[][];

  beforeEach(() => {
    warnings = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    studentsRepository.getProfileWithAvailability = async () => student();
    matchingRepository.findVariantById = async () => ({
      id: VARIANT_ID,
      learning_goal: LearningGoal.SCHOOL_CURRICULUM,
    });
    matchingRepository.findCandidateTutors = async () => [tutor('good')];
    matchingRepository.createRequestWithRecommendations = async (_s, _v, recs) => ({
      match_request_id: 'req-1',
      recommendations: recs.map((r) => ({ ...r, recommendation_id: `rec-${r.tutor_id}` })),
    });
  });

  afterEach(() => {
    studentsRepository.getProfileWithAvailability = orig.profile;
    matchingRepository.findVariantById = orig.variant;
    matchingRepository.findCandidateTutors = orig.candidates;
    matchingRepository.createRequestWithRecommendations = orig.create;
    console.warn = orig.warn;
  });

  it('skips a tutor whose stored sliders are corrupt and still ranks the others', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('corrupt-style', { style_profile: [3, 3, 3] }),
      tutor('corrupt-value', { personality_profile: [3, 3, 9, 3] }),
      tutor('good'),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(
      result.recommendations.map((r) => r.tutor.tutor_id),
      ['good']
    );
  });

  it('logs which tutor was skipped so the bad row can be fixed', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('corrupt', { style_profile: [] }),
      tutor('good'),
    ];
    await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0].join(' ')), /corrupt/);
  });

  it('does not blame the student for corrupt tutor data (no 400 from a tutor row)', async () => {
    matchingRepository.findCandidateTutors = async () => [
      tutor('corrupt', { style_profile: [0, 0, 0, 0, 0] }),
    ];
    const result = await matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID });
    assert.deepEqual(result.recommendations, []);
  });

  it('returns 422 pointing at the profile when the student sliders are invalid', async () => {
    studentsRepository.getProfileWithAvailability = async () =>
      student({ style_profile: [3, 3] });
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      (err: unknown) =>
        err instanceof UnprocessableEntityError && /profile/i.test((err as Error).message)
    );
  });

  it('returns 409 (retry) when a tutor or variant disappears between load and save', async () => {
    matchingRepository.createRequestWithRecommendations = async () => {
      throw Object.assign(new Error('Failed query: insert into "match_recommendations"'), {
        cause: Object.assign(new Error('violates foreign key'), { code: '23503' }),
      });
    };
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      (err: unknown) => err instanceof ConflictError && /try again/i.test((err as Error).message)
    );
  });

  it('lets unrelated database errors through unchanged (global handler returns 500)', async () => {
    matchingRepository.createRequestWithRecommendations = async () => {
      throw new Error('connection terminated');
    };
    await assert.rejects(
      matchingService.findTop3(STUDENT_ID, { variant_id: VARIANT_ID }),
      /connection terminated/
    );
  });
});
