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
  notifications,
} from '../../db/schema/index.js';
import {
  ApiResponse,
  ConfirmSelectionResultDto,
  DayOfWeek,
  EmailStatus,
  LearningGoal,
  MatchRequestStatus,
  MatchResultDto,
  NotificationEventType,
  SubjectCategory,
  TutorType,
  TutorTypePref,
  UserRole,
  VerificationStatus,
} from '@tutorpair/shared';

async function getJson<T = Record<string, unknown>>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

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

const SELECTED_MESSAGE =
  'A student has selected you as their tutor. Please check your contact details.';

describe('Matching Module — POST /api/matching/:id/confirm Integration Tests', () => {
  let server: Server;
  let baseUrl: string;

  const run = Date.now();
  const sub = (name: string) => `confirm-int-${name}-${run}`;
  const token = (name: string) => `Bearer mock-token-${sub(name)}`;

  const userIds: string[] = [];
  const idOf = new Map<string, string>();
  let subjectId: string;
  let variantId: string;

  async function createUser(name: string, role: UserRole): Promise<string> {
    const [user] = await db
      .insert(users)
      .values({ email: `${sub(name)}@test.tutorpair.com`, cognito_sub: sub(name), role })
      .returning();
    userIds.push(user.id);
    idOf.set(name, user.id);
    return user.id;
  }

  async function createStudent(name: string) {
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
    await db.insert(availabilities).values({
      user_id: id,
      day_of_week: DayOfWeek.MONDAY,
      start_time: '17:00',
      end_time: '19:30',
    });
  }

  async function createTutor(name: string, rate: number) {
    const id = await createUser(name, UserRole.TUTOR);
    await db.insert(tutors).values({
      user_id: id,
      first_name: `First-${name}`,
      last_name: `Last-${name}`,
      phone_number: '0811111111',
      tutor_type: TutorType.FREELANCE,
      style_profile: [3, 3, 3, 3, 3],
      personality_profile: [3, 3, 3, 3],
      verification_status: VerificationStatus.APPROVED,
    });
    await db.insert(tutorSubjects).values({
      tutor_id: id,
      variant_id: variantId,
      hourly_rate: rate.toFixed(2),
      grade_levels: ['G5', 'G6'],
    });
    await db.insert(availabilities).values({
      user_id: id,
      day_of_week: DayOfWeek.MONDAY,
      start_time: '18:00',
      end_time: '20:00',
    });
  }

  const call = (who: string | null, path: string, body: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(who ? { Authorization: token(who) } : {}),
      },
      body: JSON.stringify(body),
    });

  /** Runs a fresh match for `student` and returns the request id plus rank-1 recommendation. */
  async function newMatch(student = 'student') {
    const res = await call(student, '/api/matching', { variant_id: variantId });
    assert.equal(res.status, 200);
    const data = (await getJson<MatchResultDto>(res)).data!;
    assert.ok(data.recommendations.length >= 2, 'fixture should yield at least 2 tutors');
    return { requestId: data.match_request_id, rec: data.recommendations[0], all: data.recommendations };
  }

  const confirm = (who: string | null, requestId: string, body: unknown) =>
    call(who, `/api/matching/${requestId}/confirm`, body);

  const selectedRows = (requestId: string) =>
    db
      .select()
      .from(matchRecommendations)
      .where(
        and(
          eq(matchRecommendations.match_request_id, requestId),
          eq(matchRecommendations.is_selected, true)
        )
      );

  const tutorSelectedNotifications = (tutorId: string) =>
    db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, tutorId),
          eq(notifications.event_type, NotificationEventType.TUTOR_SELECTED)
        )
      );

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
      .values({ name: `Confirm Int Math ${run}`, category: SubjectCategory.GENERAL_LEARNING })
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

    await createStudent('student');
    await createStudent('other-student');
    await createUser('admin-caller', UserRole.ADMIN);
    // Cheaper tutor ranks first.
    await createTutor('tutor-a', 100);
    await createTutor('tutor-b', 200);
    await createTutor('tutor-c', 300);
  });

  after(async () => {
    // Cascades remove students, tutors, availabilities, match rows and notifications.
    if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
    if (subjectId) await db.delete(subjects).where(eq(subjects.id, subjectId));
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. 401 when no token is provided', async () => {
    const res = await confirm(null, randomUUID(), {
      recommendation_id: randomUUID(),
      tutor_id: randomUUID(),
    });
    assert.equal(res.status, 401);
  });

  it('2. 403 for a TUTOR', async () => {
    const res = await confirm('tutor-a', randomUUID(), {
      recommendation_id: randomUUID(),
      tutor_id: randomUUID(),
    });
    assert.equal(res.status, 403);
  });

  it('3. 403 for an ADMIN', async () => {
    const res = await confirm('admin-caller', randomUUID(), {
      recommendation_id: randomUUID(),
      tutor_id: randomUUID(),
    });
    assert.equal(res.status, 403);
  });

  it('4. 400 for a malformed body', async () => {
    const { requestId } = await newMatch();
    for (const body of [{}, { tutor_id: randomUUID() }, { recommendation_id: 'x', tutor_id: 'y' }]) {
      const res = await confirm('student', requestId, body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.ok(Array.isArray((await getJson(res)).details));
    }
  });

  it('5. 404 for an unknown match request id', async () => {
    const res = await confirm('student', randomUUID(), {
      recommendation_id: randomUUID(),
      tutor_id: randomUUID(),
    });
    assert.equal(res.status, 404);
  });

  it('6. 404 (not 500) for a malformed match request id', async () => {
    const res = await confirm('student', 'not-a-uuid', {
      recommendation_id: randomUUID(),
      tutor_id: randomUUID(),
    });
    assert.equal(res.status, 404);
  });

  it('7. 404 when the request belongs to another student, and nothing changes', async () => {
    const { requestId, rec } = await newMatch('student');
    const res = await confirm('other-student', requestId, {
      recommendation_id: rec.recommendation_id,
      tutor_id: rec.tutor.tutor_id,
    });
    assert.equal(res.status, 404);
    assert.equal((await selectedRows(requestId)).length, 0);
    const [request] = await db.select().from(matchRequests).where(eq(matchRequests.id, requestId));
    assert.equal(request.status, MatchRequestStatus.PENDING);
  });

  it('8. 404 when the recommendation is not part of this request', async () => {
    const { requestId, rec } = await newMatch();
    const res = await confirm('student', requestId, {
      recommendation_id: randomUUID(),
      tutor_id: rec.tutor.tutor_id,
    });
    assert.equal(res.status, 404);
  });

  it('9. 422 when tutor_id does not match the recommendation, and nothing changes', async () => {
    const { requestId, all } = await newMatch();
    const res = await confirm('student', requestId, {
      recommendation_id: all[0].recommendation_id,
      tutor_id: all[1].tutor.tutor_id,
    });
    assert.equal(res.status, 422);
    assert.equal((await selectedRows(requestId)).length, 0);
    assert.equal((await tutorSelectedNotifications(all[1].tutor.tutor_id)).length, 0);
  });

  it('10. 200 confirms exactly one tutor and queues one TUTOR_SELECTED email notification', async () => {
    const { requestId, rec, all } = await newMatch();
    const res = await confirm('student', requestId, {
      recommendation_id: rec.recommendation_id,
      tutor_id: rec.tutor.tutor_id,
    });
    assert.equal(res.status, 200);
    const body = await getJson<ConfirmSelectionResultDto>(res);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, {
      match_request_id: requestId,
      status: MatchRequestStatus.CONFIRMED,
      selected: { recommendation_id: rec.recommendation_id, tutor_id: rec.tutor.tutor_id },
    });

    const [request] = await db.select().from(matchRequests).where(eq(matchRequests.id, requestId));
    assert.equal(request.status, MatchRequestStatus.CONFIRMED);

    const selected = await selectedRows(requestId);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].id, rec.recommendation_id);
    assert.equal(selected[0].tutor_id, rec.tutor.tutor_id);

    const sent = await tutorSelectedNotifications(rec.tutor.tutor_id);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].requires_email, true);
    assert.equal(sent[0].email_status, EmailStatus.PENDING);
    assert.equal(sent[0].is_read, false);
    assert.equal(sent[0].message, SELECTED_MESSAGE);

    // Other recommended tutors are not notified.
    for (const other of all.slice(1)) {
      assert.equal((await tutorSelectedNotifications(other.tutor.tutor_id)).length, 0);
    }
  });

  it('11. the confirm response has no contact fields at any depth', async () => {
    const { requestId, rec } = await newMatch();
    const res = await confirm('student', requestId, {
      recommendation_id: rec.recommendation_id,
      tutor_id: rec.tutor.tutor_id,
    });
    const keys = collectKeys(await res.json());
    for (const forbidden of ['phone_number', 'line_id', 'email', 'rejection_reason']) {
      assert.equal(keys.has(forbidden), false, `${forbidden} leaked`);
    }
  });

  it('12. a second confirm returns 409 and does not duplicate anything', async () => {
    const { requestId, rec, all } = await newMatch();
    const body = { recommendation_id: rec.recommendation_id, tutor_id: rec.tutor.tutor_id };
    const before = (await tutorSelectedNotifications(rec.tutor.tutor_id)).length;

    assert.equal((await confirm('student', requestId, body)).status, 200);
    // Even picking a different tutor on an already confirmed request is refused.
    const second = await confirm('student', requestId, {
      recommendation_id: all[1].recommendation_id,
      tutor_id: all[1].tutor.tutor_id,
    });
    assert.equal(second.status, 409);
    assert.equal((await confirm('student', requestId, body)).status, 409);

    assert.equal((await selectedRows(requestId)).length, 1);
    assert.equal((await tutorSelectedNotifications(rec.tutor.tutor_id)).length, before + 1);
    assert.equal((await tutorSelectedNotifications(all[1].tutor.tutor_id)).length, 0);
  });

  it('13. two simultaneous confirms: exactly one 200 and one 409, one selection, one notification', async () => {
    const { requestId, rec } = await newMatch();
    const before = (await tutorSelectedNotifications(rec.tutor.tutor_id)).length;
    const body = { recommendation_id: rec.recommendation_id, tutor_id: rec.tutor.tutor_id };

    const results = await Promise.all([
      confirm('student', requestId, body),
      confirm('student', requestId, body),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);

    assert.equal((await selectedRows(requestId)).length, 1);
    assert.equal((await tutorSelectedNotifications(rec.tutor.tutor_id)).length, before + 1);
  });

  it('14. 422 and no changes when the tutor is no longer APPROVED', async () => {
    const { requestId, rec } = await newMatch();
    const tutorId = rec.tutor.tutor_id;
    await db
      .update(tutors)
      .set({ verification_status: VerificationStatus.REJECTED })
      .where(eq(tutors.user_id, tutorId));
    try {
      const before = (await tutorSelectedNotifications(tutorId)).length;
      const res = await confirm('student', requestId, {
        recommendation_id: rec.recommendation_id,
        tutor_id: tutorId,
      });
      assert.equal(res.status, 422);
      assert.match((await getJson(res)).message ?? '', /no longer available/i);

      const [request] = await db.select().from(matchRequests).where(eq(matchRequests.id, requestId));
      assert.equal(request.status, MatchRequestStatus.PENDING);
      assert.equal((await selectedRows(requestId)).length, 0);
      assert.equal((await tutorSelectedNotifications(tutorId)).length, before);
    } finally {
      await db
        .update(tutors)
        .set({ verification_status: VerificationStatus.APPROVED })
        .where(eq(tutors.user_id, tutorId));
    }
  });
});
