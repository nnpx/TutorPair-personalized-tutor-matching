import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { eq, inArray } from 'drizzle-orm';
import { createApp } from '../../app.js';
import { db } from '../../db/client.js';
import { users, subjectVariants, matchRequests } from '../../db/schema/index.js';
import { ApiResponse, MatchResultDto } from '@tutorpair/shared';

/**
 * Needs the dev seed (`npm run db:seed`) and the demo student profile.
 * Primary (G1-G6) variants cannot match the G10 demo student, so they use the seeded primary student.
 */
const DEMO = 'student@tutorpair.local';
const PRIMARY = 'mina.primary@tutorpair.local';

const CASES: Array<[student: string, variant: string]> = [
  [DEMO, 'School Curriculum Mathematics'],
  [DEMO, 'Math Olympiad & Competitions'],
  [DEMO, 'School English (Grammar & Writing)'],
  [DEMO, 'Digital SAT Math (700+)'],
  [DEMO, 'Digital SAT Reading & Writing'],
  [DEMO, 'IELTS Academic (Target 6.5+)'],
  [DEMO, 'Medical Biology & POSN Olympiad'],
  [DEMO, 'Chemistry Olympiad (POSN)'],
  [DEMO, 'TPAT 1 Medical Aptitude (GAT-Doctor)'],
  [DEMO, 'Python Programming & Algorithms (G7–G12)'],
  [PRIMARY, 'Primary School Mathematics (G1–G6)'],
  [PRIMARY, 'Primary English Foundations (G1–G6)'],
  [PRIMARY, 'Primary School Science (G1–G6)'],
  [PRIMARY, 'Primary Thai Reading & Writing (G1–G6)'],
  [PRIMARY, 'Scratch & Block Coding (G1–G6)'],
];

describe('Seeded data — every demo variant yields exactly 3 recommendations', () => {
  let server: Server;
  let baseUrl: string;
  const createdRequestIds: string[] = [];

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (createdRequestIds.length) {
      await db.delete(matchRequests).where(inArray(matchRequests.id, createdRequestIds));
    }
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  for (const [email, variantName] of CASES) {
    it(`${variantName} -> 3 distinct-score matches for ${email}`, async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      assert.ok(user, `seeded user ${email} missing (run npm run db:seed)`);
      const [variant] = await db
        .select()
        .from(subjectVariants)
        .where(eq(subjectVariants.name, variantName))
        .limit(1);
      assert.ok(variant, `variant ${variantName} missing`);

      const res = await fetch(`${baseUrl}/api/matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${user.cognito_sub}`,
        },
        body: JSON.stringify({ variant_id: variant.id }),
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiResponse<MatchResultDto>;
      const data = json.data!;
      createdRequestIds.push(data.match_request_id);
      assert.equal(data.recommendations.length, 3);
      assert.equal(new Set(data.recommendations.map((r) => r.score)).size, 3, 'scores should differ');
    });
  }
});
