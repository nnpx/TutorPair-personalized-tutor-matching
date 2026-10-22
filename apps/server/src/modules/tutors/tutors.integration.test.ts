import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { createApp } from '../../app.js';
import { db } from '../../db/client.js';
import { users, subjectVariants } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { UserRole, DayOfWeek, TutorType, ApiResponse } from '@tutorpair/shared';

// Type-safe JSON parser for test responses
async function getJson<T = Record<string, unknown>>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

interface TutorProfileDto {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  description: string | null;
  tutor_type: TutorType;
  style_profile: number[];
  personality_profile: number[];
  hourly_rate: number;
  verification_status: string;
  rejection_reason: string | null;
  average_rating: number;
  review_count: number;
}

interface SubjectItemDto {
  variant_id: string;
  subject_id: string;
  subject_name: string;
  variant_name: string;
  category: string;
  learning_goal: string;
  requires_proof: boolean;
  hourly_rate: number;
  grade_levels: string[] | null;
  teaching_focus: string | null;
}

interface AvailabilitySlotDto {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

interface VerificationDto {
  verification_status: string;
  rejection_reason: string | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_key: string;
    file_size_kb: number;
    variant_id: string | null;
    uploaded_at: string;
  }>;
}

describe('Tutors Module — Integration Tests', () => {
  let server: Server;
  let baseUrl: string;
  let testTutorUserId: string;
  let testStudentUserId: string;
  let existingVariantId: string;

  const tutorSub = `integration-tutor-${Date.now()}`;
  const studentSub = `integration-student-${Date.now()}`;

  before(async () => {
    // 1. Start ephemeral HTTP server on dynamic port
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

    // 2. Insert test tutor user
    const [tutorUser] = await db
      .insert(users)
      .values({
        email: `${tutorSub}@test.tutorpair.com`,
        cognito_sub: tutorSub,
        role: UserRole.TUTOR,
      })
      .returning();
    testTutorUserId = tutorUser.id;

    // 3. Insert test student user (for 403 test)
    const [studentUser] = await db
      .insert(users)
      .values({
        email: `${studentSub}@test.tutorpair.com`,
        cognito_sub: studentSub,
        role: UserRole.STUDENT,
      })
      .returning();
    testStudentUserId = studentUser.id;

    // 4. Find an existing subject variant for subjects test
    const [variant] = await db.select({ id: subjectVariants.id }).from(subjectVariants).limit(1);
    if (variant) {
      existingVariantId = variant.id;
    }
  });

  after(async () => {
    // Cleanup test users (cascade deletes tutors, availabilities, subjects)
    if (testTutorUserId) {
      await db.delete(users).where(eq(users.id, testTutorUserId));
    }
    if (testStudentUserId) {
      await db.delete(users).where(eq(users.id, testStudentUserId));
    }

    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('1. GET /api/tutors/profile — fails with 401 when no token is provided', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/profile`);
    assert.strictEqual(res.status, 401);
    const body = await getJson(res);
    assert.strictEqual(body.success, false);
    assert.match(body.message ?? '', /Authorization/i);
  });

  it('2. GET /api/tutors/profile — fails with 403 when authenticated as STUDENT', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/profile`, {
      headers: {
        Authorization: `Bearer mock-token-${studentSub}`,
      },
    });
    assert.strictEqual(res.status, 403);
    const body = await getJson(res);
    assert.strictEqual(body.success, false);
    assert.match(body.message ?? '', /Access denied/i);
  });

  it('3. POST /api/tutors/profile — fails with 400 when validation rules are violated', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: '', // Empty: violates min(1)
        last_name: 'Jaidee',
        phone_number: '0812345678',
        tutor_type: TutorType.UNDERGRADUATE,
        style_profile: [1, 2], // Invalid: must have 5 ratings
        personality_profile: [3, 4, 5, 2],
        hourly_rate: -100, // Invalid: must be positive
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await getJson(res);
    assert.strictEqual(body.success, false);
    assert.ok(Array.isArray(body.details));
  });

  it('4. POST /api/tutors/profile — creates tutor profile successfully (201 Created)', async () => {
    const payload = {
      first_name: 'Somchai',
      last_name: 'Jaidee',
      phone_number: '0812345678',
      description: 'Experienced Mathematics tutor',
      tutor_type: TutorType.UNDERGRADUATE,
      style_profile: [4, 5, 3, 4, 2],
      personality_profile: [5, 4, 4, 3],
    };

    const res = await fetch(`${baseUrl}/api/tutors/profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const body = await getJson<TutorProfileDto>(res);
    assert.strictEqual(body.success, true);
    assert.ok(body.data);
    assert.strictEqual(body.data.first_name, 'Somchai');
    assert.strictEqual(body.data.verification_status, 'PENDING');
  });

  it('5. GET /api/tutors/profile — fetches the created profile (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/profile`, {
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await getJson<TutorProfileDto>(res);
    assert.strictEqual(body.success, true);
    assert.ok(body.data);
    assert.strictEqual(body.data.first_name, 'Somchai');
    assert.strictEqual(body.data.last_name, 'Jaidee');
    assert.strictEqual(body.data.verification_status, 'PENDING');
  });

  it('6. PATCH /api/tutors/profile — partially updates profile (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: '0899999999',
        description: 'Updated description with new credentials',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await getJson<TutorProfileDto>(res);
    assert.strictEqual(body.success, true);
    assert.ok(body.data);
    assert.strictEqual(body.data.phone_number, '0899999999');
    assert.strictEqual(body.data.description, 'Updated description with new credentials');
  });

  it('7. PUT & GET /api/tutors/subjects — replaces and fetches subjects', async () => {
    if (!existingVariantId) {
      return; // Skip if database was not seeded
    }

    // Set subjects
    const putRes = await fetch(`${baseUrl}/api/tutors/subjects`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subjects: [
          {
            variant_id: existingVariantId,
            hourly_rate: 650.0,
            grade_levels: ['G10', 'G11'],
            teaching_focus: 'Test focus',
          },
        ],
      }),
    });

    assert.strictEqual(putRes.status, 200);
    const putBody = await getJson<{ subjects: SubjectItemDto[] }>(putRes);
    assert.strictEqual(putBody.success, true);
    assert.ok(putBody.data);
    assert.strictEqual(putBody.data.subjects.length, 1);
    assert.strictEqual(putBody.data.subjects[0].variant_id, existingVariantId);
    assert.strictEqual(putBody.data.subjects[0].hourly_rate, 650);

    // Get subjects
    const getRes = await fetch(`${baseUrl}/api/tutors/subjects`, {
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
      },
    });

    assert.strictEqual(getRes.status, 200);
    const getBody = await getJson<{ subjects: SubjectItemDto[] }>(getRes);
    assert.strictEqual(getBody.success, true);
    assert.ok(getBody.data);
    assert.strictEqual(getBody.data.subjects.length, 1);
    assert.strictEqual(getBody.data.subjects[0].variant_id, existingVariantId);
  });

  it('8. PUT & GET /api/tutors/availability — replaces and fetches weekly availability', async () => {
    const putRes = await fetch(`${baseUrl}/api/tutors/availability`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '17:00',
            end_time: '20:00',
          },
          {
            day_of_week: DayOfWeek.SATURDAY,
            start_time: '09:00',
            end_time: '12:00',
          },
        ],
      }),
    });

    assert.strictEqual(putRes.status, 200);
    const putBody = await getJson<{ availability: AvailabilitySlotDto[] }>(putRes);
    assert.strictEqual(putBody.success, true);
    assert.ok(putBody.data);
    assert.strictEqual(putBody.data.availability.length, 2);

    const getRes = await fetch(`${baseUrl}/api/tutors/availability`, {
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
      },
    });

    assert.strictEqual(getRes.status, 200);
    const getBody = await getJson<{ availability: AvailabilitySlotDto[] }>(getRes);
    assert.strictEqual(getBody.success, true);
    assert.ok(getBody.data);
    assert.strictEqual(getBody.data.availability.length, 2);
  });

  it('9. GET /api/tutors/verification — fetches verification status and documents', async () => {
    const res = await fetch(`${baseUrl}/api/tutors/verification`, {
      headers: {
        Authorization: `Bearer mock-token-${tutorSub}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await getJson<VerificationDto>(res);
    assert.strictEqual(body.success, true);
    assert.ok(body.data);
    assert.strictEqual(body.data.verification_status, 'PENDING');
    assert.ok(Array.isArray(body.data.documents));
  });
});
