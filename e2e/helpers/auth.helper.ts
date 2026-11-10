import { Page } from '@playwright/test';

export type UserRoleType = 'STUDENT' | 'TUTOR' | 'ADMIN';

export const USER_CREDENTIALS = {
  STUDENT: {
    email: 'student@tutorpair.local',
    id: 'mock-student-id',
    role: 'STUDENT' as const,
  },
  TUTOR: {
    email: 'tutor@tutorpair.local',
    id: 'mock-tutor-id',
    role: 'TUTOR' as const,
  },
  ADMIN: {
    email: 'admin@tutorpair.local',
    id: 'mock-admin-id',
    role: 'ADMIN' as const,
  },
};

/**
 * Authenticates a browser page session as the given role using TutorPair's mock auth mechanism.
 */
export async function loginAs(
  page: Page,
  role: UserRoleType,
  customEmail?: string,
) {
  const creds = USER_CREDENTIALS[role];
  const email = customEmail || creds.email;
  const token = `mock-token-${creds.id}`;

  await page.goto('/login');
  await page.evaluate(
    ({ role, email, token }) => {
      const sessionData = {
        state: {
          user: {
            id:
              role === 'STUDENT'
                ? 'mock-student-id'
                : role === 'TUTOR'
                  ? 'mock-tutor-id'
                  : 'mock-admin-id',
            email,
            role,
            cognito_sub: `mock-${role.toLowerCase()}-id`,
          },
          token,
          isLoading: false,
        },
        version: 0,
      };
      localStorage.setItem(
        'tutorpair-auth-session',
        JSON.stringify(sessionData),
      );
    },
    { role, email, token },
  );

  // Navigate to appropriate role dashboard
  if (role === 'STUDENT') {
    await page.goto('/student/matching');
  } else if (role === 'TUTOR') {
    await page.goto('/tutor/profile');
  } else if (role === 'ADMIN') {
    await page.goto('/admin/verifications');
  }
}
