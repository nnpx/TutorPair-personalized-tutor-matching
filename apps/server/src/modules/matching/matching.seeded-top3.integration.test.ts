import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { eq, inArray } from 'drizzle-orm';
import { createApp } from '../../app.js';
import { db } from '../../db/client.js';
import { users, subjectVariants, matchRequests } from '../../db/schema/index.js';
import { ApiResponse, MatchResultDto } from '@tutorpair/shared';

/**
 * Needs the dev seed (`SEED_MOCK_USERS=true npm run db:seed`).
 * Iterates EVERY subject variant in the database and picks a seeded student whose grade fits it:
 * (G1-G6) -> Mina (G4), (G7-G9) -> Nara (G8), everything else -> demo student (G10).
 */
const DEMO = 'student@tutorpair.local';
const PRIMARY = 'mina.primary@tutorpair.local';
const LOWER_SECONDARY = 'nara.lower@tutorpair.local';

function studentFor(variantName: string): string {
  if (variantName.includes('(G1–G6)')) return PRIMARY;
  if (variantName.includes('(G7–G9)')) return LOWER_SECONDARY;
  return DEMO;
}

describe('Seeded data — every subject variant yields exactly 3 recommendations', () => {
  let server: Server;
  let baseUrl: string;
  let variants: Array<{ id: string; name: string }> = [];
  const createdRequestIds: string[] = [];

  before(async () => {
    variants = await db.select({ id: subjectVariants.id, name: subjectVariants.name }).from(subjectVariants);
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

  it('database has subject variants to check', () => {
    assert.ok(variants.length > 0, 'no subject variants found (run npm run db:seed)');
  });

  it('every variant -> exactly 3 matches for a grade-appropriate seeded student', async () => {
    const failures: string[] = [];
    for (const variant of variants) {
      const email = studentFor(variant.name);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      assert.ok(user, `seeded user ${email} missing (run SEED_MOCK_USERS=true npm run db:seed)`);

      const res = await fetch(`${baseUrl}/api/matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token-${user.cognito_sub}`,
        },
        body: JSON.stringify({ variant_id: variant.id }),
      });
      if (res.status !== 200) {
        failures.push(`${variant.name} (${email}): HTTP ${res.status}`);
        continue;
      }
      const data = ((await res.json()) as ApiResponse<MatchResultDto>).data!;
      createdRequestIds.push(data.match_request_id);
      if (data.recommendations.length !== 3) {
        failures.push(`${variant.name} (${email}): got ${data.recommendations.length} recommendations, expected 3`);
      }
    }
    assert.deepEqual(failures, [], `Variants without exactly 3 matches:\n${failures.join('\n')}`);
  });
});
