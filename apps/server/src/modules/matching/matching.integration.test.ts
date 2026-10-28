import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { createApp } from '../../app.js';
import { db } from '../../db/client.js';
import {
  users,
  students,
  tutors,
  subjects,
  subjectVariants,
  tutorSubjects,
  availabilities,
  matchRequests,
  matchRecommendations,
} from '../../db/schema/index.js';
import {
  ApiResponse,
  DayOfWeek,
  LearningGoal,
  MatchRequestStatus,
  MatchResultDto,
  SubjectCategory,
  TutorType,
  TutorTypePref,
  UserRole,
  VerificationStatus,
} from '@tutorpair/shared';

async function getJson<T = Record<string, unknown>>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

/** Collects every object key at any depth, to prove forbidden fields never appear. */
function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((v) => collectKeys(v, keys));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      keys.add(k);
      collectKeys(v, keys);
    }
  }
  return keys;
}

const FORBIDDEN_KEYS = [
  'phone_number',
  'line_id',
  'rejection_reason',
  'verification_status',
  'file_key',
  'email',
  'style_profile',
  'personality_profile',
];

describe('Matching Module — POST /api/matching Integration Tests', () => {
  let server: Server;
  let baseUrl: string;

  const run = Date.now();
  const sub = (name: string) => `match-int-${name}-${run}`;
  const token = (name: string) => `Bearer mock-token-${sub(name)}`;

  const userIds: string[] = [];
  let subjectId: string;
  let variantId: string; // SCHOOL_CURRICULUM
  let emptyVariantId: string; // nobody teaches it
  const tutorIdByName = new Map<string, string>();
  let studentId: string;

  async function createUser(name: string, role: UserRole): Promise<string> {
    const [user] = await db
      .insert(users)
      .values({ email: `${sub(name)}@test.tutorpair.com`, cognito_sub: sub(name), role })
      .returning();
    userIds.push(user.id);
    return user.id;
  }

  async function createTutor(
    name: string,
    opts: {
      rate: number;
      status?: VerificationStatus;
      grades?: string[];
      slot?: [DayOfWeek, string, string];
    }
  ) {
    const id = await createUser(name, UserRole.TUTOR);
    tutorIdByName.set(name, id);
    await db.insert(tutors).values({
      user_id: id,
      first_name: `First-${name}`,
      last_name: `Last-${name}`,
      phone_number: '0811111111',
      line_id: `line-${name}`,
      description: `About ${name}`,
      tutor_type: TutorType.FREELANCE,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      verification_status: opts.status ?? VerificationStatus.APPROVED,
      rejection_reason: 'secret internal reason',
    });
    await db.insert(tutorSubjects).values({
      tutor_id: id,
      variant_id: variantId,
      hourly_rate: opts.rate.toFixed(2),
      grade_levels: opts.grades ?? ['G5', 'G6'],
      teaching_focus: 'Kangaroo Math',
    });
    const [day, start, end] = opts.slot ?? [DayOfWeek.MONDAY, '18:00', '20:00'];
    await db
      .insert(availabilities)
      .values({ user_id: id, day_of_week: day, start_time: start, end_time: end });
    return id;
  }

  async function createStudent(name: string, withSlot: boolean): Promise<string> {
    const id = await createUser(name, UserRole.STUDENT);
    await db.insert(students).values({
      user_id: id,
      first_name: 'Nok',
      last_name: 'Student',
      phone_number: '0899999999',
      line_id: 'nok.line',
      grade_level: 'G6',
      tutor_type_pref: TutorTypePref.ANY,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      budget_max: '500.00',
    });
    if (withSlot) {
      await db.insert(availabilities).values({
        user_id: id,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '17:00',
        end_time: '19:30',
      });
    }
    return id;
  }

  const post = (who: string | null, body: unknown) =>
    fetch(`${baseUrl}/api/matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(who ? { Authorization: token(who) } : {}),
      },
      body: JSON.stringify(body),
    });

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });

    const [subject] = await db
      .insert(subjects)
      .values({ name: `Match Int Math ${run}`, category: SubjectCategory.GENERAL_LEARNING })
      .returning();
    subjectId = subject.id;
    const [variant] = await db
      .insert(subjectVariants)
      .values({
        subject_id: subjectId,
        name: 'Primary School',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
      })
      .returning();
    variantId = variant.id;
    const [empty] = await db
      .insert(subjectVariants)
      .values({
        subject_id: subjectId,
        name: 'Nobody Teaches This',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
      })
      .returning();
    emptyVariantId = empty.id;

    studentId = await createStudent('student', true);
    await createStudent('student-noslot', false);
    await createUser('student-noprofile', UserRole.STUDENT);
    await createUser('tutor-caller', UserRole.TUTOR);
    await createUser('admin-caller', UserRole.ADMIN);

    // Five eligible tutors; with identical sliders a cheaper rate scores higher (budget 500).
    for (const [name, rate] of [
      ['t100', 100],
      ['t200', 200],
      ['t300', 300],
      ['t400', 400],
      ['t450', 450],
    ] as const) {
      await createTutor(name, { rate });
    }
    // Eliminated by the hard filters:
    await createTutor('pending', { rate: 50, status: VerificationStatus.PENDING });
    await createTutor('g12only', { rate: 50, grades: ['G12'] });
    await createTutor('tuesday', { rate: 50, slot: [DayOfWeek.TUESDAY, '18:00', '20:00'] });
  });

  after(async () => {
    // Cascades remove tutors, students, availabilities, tutor_subjects and match rows.
    if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
    if (subjectId) await db.delete(subjects).where(eq(subjects.id, subjectId));
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. 401 when no token is provided', async () => {
    const res = await post(null, { variant_id: variantId });
    assert.equal(res.status, 401);
    assert.equal((await getJson(res)).success, false);
  });

  it('2. 403 for a TUTOR', async () => {
    const res = await post('tutor-caller', { variant_id: variantId });
    assert.equal(res.status, 403);
  });

  it('3. 403 for an ADMIN', async () => {
    const res = await post('admin-caller', { variant_id: variantId });
    assert.equal(res.status, 403);
  });

  it('4. 400 for a malformed body', async () => {
    for (const body of [{}, { variant_id: 'x' }, { variant_id: 123 }]) {
      const res = await post('student', body);
      assert.equal(res.status, 400, JSON.stringify(body));
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.ok(Array.isArray(json.details));
    }
  });

  it('5. 404 for an unknown variant', async () => {
    const res = await post('student', { variant_id: randomUUID() });
    assert.equal(res.status, 404);
  });

  it('6. 404 when the student has no profile yet', async () => {
    const res = await post('student-noprofile', { variant_id: variantId });
    assert.equal(res.status, 404);
  });

  it('7. 422 with a clear message when the student has no availability', async () => {
    const res = await post('student-noslot', { variant_id: variantId });
    assert.equal(res.status, 422);
    assert.match((await getJson(res)).message ?? '', /availability/i);
  });

  it('8. 200 returns the Top 3 ranked 1..3 and excludes tutors failing the hard filters', async () => {
    const res = await post('student', { variant_id: variantId });
    assert.equal(res.status, 200);
    const body = await getJson<MatchResultDto>(res);
    assert.equal(body.success, true);
    const data = body.data!;

    assert.equal(data.variant_id, variantId);
    assert.equal(data.status, MatchRequestStatus.PENDING);
    assert.equal(data.recommendations.length, 3);
    assert.deepEqual(
      data.recommendations.map((r) => r.rank),
      [1, 2, 3]
    );
    assert.deepEqual(
      data.recommendations.map((r) => r.tutor.tutor_id),
      ['t100', 't200', 't300'].map((n) => tutorIdByName.get(n))
    );

    const scores = data.recommendations.map((r) => r.score);
    assert.deepEqual([...scores].sort((a, b) => b - a), scores);
    scores.forEach((s) => assert.ok(s >= 0 && s <= 100));

    const rec = data.recommendations[0];
    assert.ok(rec.recommendation_id);
    assert.equal(rec.tutor.first_name, 'First-t100');
    assert.equal(rec.tutor.hourly_rate, 100);
    assert.equal(rec.tutor.tutor_type, TutorType.FREELANCE);
    assert.equal(rec.tutor.teaching_focus, 'Kangaroo Math');
    assert.equal(typeof rec.tutor.average_rating, 'number');
    assert.equal(typeof rec.tutor.review_count, 'number');
  });

  it('9. the response contains no contact, verification or profile-internal fields at any depth', async () => {
    const res = await post('student', { variant_id: variantId });
    const text = await res.text();
    const keys = collectKeys(JSON.parse(text));
    for (const forbidden of FORBIDDEN_KEYS) {
      assert.equal(keys.has(forbidden), false, `${forbidden} leaked`);
    }
    assert.equal(text.includes('secret internal reason'), false);
    assert.equal(text.includes('0811111111'), false);
    assert.equal(text.includes('line-t100'), false);
  });

  it('10. persists the request and its recommendations (rank and score match the response)', async () => {
    const res = await post('student', { variant_id: variantId });
    const data = (await getJson<MatchResultDto>(res)).data!;

    const [request] = await db
      .select()
      .from(matchRequests)
      .where(eq(matchRequests.id, data.match_request_id));
    assert.equal(request.student_id, studentId);
    assert.equal(request.variant_id, variantId);
    assert.equal(request.status, MatchRequestStatus.PENDING);

    const rows = await db
      .select()
      .from(matchRecommendations)
      .where(eq(matchRecommendations.match_request_id, data.match_request_id));
    assert.equal(rows.length, 3);
    for (const rec of data.recommendations) {
      const row = rows.find((r) => r.id === rec.recommendation_id)!;
      assert.equal(row.tutor_id, rec.tutor.tutor_id);
      assert.equal(row.rank, rec.rank);
      assert.equal(Number(row.score), rec.score);
      assert.equal(row.is_selected, false);
    }
  });

  it('11. is deterministic, and re-running replaces the previous open request for the variant', async () => {
    const first = (await getJson<MatchResultDto>(await post('student', { variant_id: variantId })))
      .data!;
    const second = (await getJson<MatchResultDto>(await post('student', { variant_id: variantId })))
      .data!;

    const shape = (d: MatchResultDto) =>
      d.recommendations.map((r) => [r.rank, r.tutor.tutor_id, r.score]);
    assert.deepEqual(shape(second), shape(first));

    const open = await db
      .select()
      .from(matchRequests)
      .where(
        and(
          eq(matchRequests.student_id, studentId),
          eq(matchRequests.variant_id, variantId),
          eq(matchRequests.status, MatchRequestStatus.PENDING)
        )
      );
    assert.equal(open.length, 1);
    assert.equal(open[0].id, second.match_request_id);
  });

  it('12. zero survivors returns 200 with an empty list and still records the request', async () => {
    const res = await post('student', { variant_id: emptyVariantId });
    assert.equal(res.status, 200);
    const data = (await getJson<MatchResultDto>(res)).data!;
    assert.deepEqual(data.recommendations, []);

    const [request] = await db
      .select()
      .from(matchRequests)
      .where(eq(matchRequests.id, data.match_request_id));
    assert.ok(request);
  });
});
