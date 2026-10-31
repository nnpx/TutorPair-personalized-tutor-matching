import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { createApp } from '../../../app.js';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema/index.js';
import { inArray } from 'drizzle-orm';
import { UserRole, ApiResponse } from '@tutorpair/shared';

async function getJson<T = Record<string, unknown>>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

describe('Auth Module — Integration Tests (Module 2)', () => {
  let server: Server;
  let baseUrl: string;
  const createdUserIds: string[] = [];

  const timestamp = Date.now();
  const studentSub = `auth-test-student-${timestamp}`;
  const studentEmail = `student-${timestamp}@test.tutorpair.local`;
  const tutorSub = `auth-test-tutor-${timestamp}`;
  const tutorEmail = `tutor-${timestamp}@test.tutorpair.local`;
  const adminSub = `auth-test-admin-${timestamp}`;
  const adminEmail = `admin-${timestamp}@test.tutorpair.local`;

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

    // Seed an admin user for RBAC verification
    const [adminUser] = await db
      .insert(users)
      .values({
        cognito_sub: adminSub,
        email: adminEmail,
        role: UserRole.ADMIN,
      })
      .returning();
    createdUserIds.push(adminUser.id);
  });

  after(async () => {
    if (createdUserIds.length > 0) {
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('POST /api/auth/sync', () => {
    it('1. should provision a new student on first-time login (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${studentSub}`,
          'X-Mock-Email': studentEmail,
        },
        body: JSON.stringify({ role: UserRole.STUDENT }),
      });

      assert.equal(res.status, 201);
      const json = await getJson<{
        id: string;
        cognito_sub: string;
        email: string;
        role: string;
        is_new_user: boolean;
      }>(res);

      assert.equal(json.success, true);
      assert.equal(json.data?.role, UserRole.STUDENT);
      assert.equal(json.data?.email, studentEmail);
      assert.equal(json.data?.is_new_user, true);

      if (json.data?.id) {
        createdUserIds.push(json.data.id);
      }
    });

    it('2. should return existing record and maintain role immutability on subsequent sync (200 OK)', async () => {
      // Attempt to tamper role from STUDENT to TUTOR
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${studentSub}`,
          'X-Mock-Email': studentEmail,
        },
        body: JSON.stringify({ role: UserRole.TUTOR }),
      });

      assert.equal(res.status, 200);
      const json = await getJson<{
        id: string;
        role: string;
        is_new_user: boolean;
      }>(res);

      assert.equal(json.success, true);
      assert.equal(json.data?.role, UserRole.STUDENT); // Kept original role
      assert.equal(json.data?.is_new_user, false);
    });

    it('3. should reject self-registration with ADMIN role (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-unregistered-${timestamp}`,
          'X-Mock-Email': `hacker-${timestamp}@test.local`,
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      });

      assert.equal(res.status, 400);
      const json = await getJson(res);
      assert.equal(json.success, false);
    });

    it('4. should reject missing role in request body (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${studentSub}`,
        },
        body: JSON.stringify({}),
      });

      assert.equal(res.status, 400);
      const json = await getJson(res);
      assert.equal(json.success, false);
    });

    it('5. should reject unauthenticated request without token on sync (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: UserRole.STUDENT }),
      });

      assert.equal(res.status, 401);
      const json = await getJson(res);
      assert.equal(json.success, false);
    });

    it('6. should reject malformed Authorization header (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic invalid-auth-format',
        },
        body: JSON.stringify({ role: UserRole.STUDENT }),
      });

      assert.equal(res.status, 401);
      const json = await getJson(res);
      assert.equal(json.success, false);
    });

    it('7. should prevent duplicate account creation with the same email (409 Conflict)', async () => {
      // Different sub attempting to claim the studentEmail
      const differentSub = `attacker-sub-${timestamp}`;
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${differentSub}`,
          'X-Mock-Email': studentEmail, // Already registered to studentSub
        },
        body: JSON.stringify({ role: UserRole.STUDENT }),
      });

      assert.equal(res.status, 409);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /already exists/i);
    });

    it('8. should successfully provision a new tutor (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${tutorSub}`,
          'X-Mock-Email': tutorEmail,
        },
        body: JSON.stringify({ role: UserRole.TUTOR }),
      });

      assert.equal(res.status, 201);
      const json = await getJson<{ id: string; role: string; is_new_user: boolean }>(res);
      assert.equal(json.success, true);
      assert.equal(json.data?.role, UserRole.TUTOR);
      assert.equal(json.data?.is_new_user, true);

      if (json.data?.id) {
        createdUserIds.push(json.data.id);
      }
    });
  });

  describe('GET /api/auth/me & GET /api/users/me', () => {
    it('9. should return authenticated user details and profile completion status (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer mock-token-${studentSub}`,
        },
      });

      assert.equal(res.status, 200);
      const json = await getJson<{
        id: string;
        email: string;
        role: string;
        profile_completed: boolean;
      }>(res);

      assert.equal(json.success, true);
      assert.equal(json.data?.email, studentEmail);
      assert.equal(json.data?.role, UserRole.STUDENT);
      assert.equal(json.data?.profile_completed, false); // No student profile record created yet
    });

    it('10. should work identically on alias /api/users/me (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer mock-token-${studentSub}`,
        },
      });

      assert.equal(res.status, 200);
      const json = await getJson<{ id: string; role: string }>(res);
      assert.equal(json.success, true);
      assert.equal(json.data?.role, UserRole.STUDENT);
    });

    it('11. should return 401 Unauthorized for missing token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const json = await getJson(res);
      assert.equal(json.success, false);
    });

    it('12. should return 401 Unauthorized for unsynced user calling /me directly', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer mock-token-non-existent-sub-${timestamp}`,
        },
      });

      assert.equal(res.status, 401);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /Please sync your account/i);
    });
  });

  describe('POST /api/auth/mock-login & POST /api/auth/logout', () => {
    it('13. should issue mock credentials in development mode (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/mock-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: UserRole.STUDENT,
          email: `mock-dev-${timestamp}@tutorpair.local`,
        }),
      });

      assert.equal(res.status, 200);
      const json = await getJson<{
        token: string;
        user: { id: string; role: string };
      }>(res);

      assert.equal(json.success, true);
      assert.ok(json.data?.token.startsWith('mock-token-'));
      assert.equal(json.data?.user.role, UserRole.STUDENT);

      if (json.data?.user.id) {
        createdUserIds.push(json.data.user.id);
      }
    });

    it('14. should acknowledge logout (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${studentSub}`,
        },
      });

      assert.equal(res.status, 200);
      const json = await getJson(res);
      assert.equal(json.success, true);
    });
  });

  describe('Role-Based Access Control (RBAC) Enforcement', () => {
    it('15. should allow Admin to access admin route (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/tutors`, {
        headers: {
          Authorization: `Bearer mock-token-${adminSub}`,
        },
      });

      assert.equal(res.status, 200);
    });

    it('16. should deny Student access to admin route (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/tutors`, {
        headers: {
          Authorization: `Bearer mock-token-${studentSub}`,
        },
      });

      assert.equal(res.status, 403);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /Access denied/i);
    });

    it('17. should deny Tutor access to admin route (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/tutors`, {
        headers: {
          Authorization: `Bearer mock-token-${tutorSub}`,
        },
      });

      assert.equal(res.status, 403);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /Access denied/i);
    });

    it('18. should deny Student access to tutor-only route (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/tutors/profile`, {
        headers: {
          Authorization: `Bearer mock-token-${studentSub}`,
        },
      });

      assert.equal(res.status, 403);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /Access denied/i);
    });

    it('19. should deny Tutor access to student-only route (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/students/profile`, {
        headers: {
          Authorization: `Bearer mock-token-${tutorSub}`,
        },
      });

      assert.equal(res.status, 403);
      const json = await getJson(res);
      assert.equal(json.success, false);
      assert.match(json.message ?? '', /Access denied/i);
    });
  });
});
