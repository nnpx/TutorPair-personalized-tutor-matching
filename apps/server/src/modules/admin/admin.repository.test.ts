import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PgDialect } from 'drizzle-orm/pg-core';
import { db } from '../../db/client.js';
import { adminRepository } from './admin.repository.js';
import { VerificationStatus } from '@tutorpair/shared';

// Captures the ORDER BY handed to the query builder without touching a real database.
async function orderByFor(status?: VerificationStatus | 'ALL') {
  let captured = '';
  const chain: any = {
    from: () => chain,
    innerJoin: () => chain,
    $dynamic: () => chain,
    where: () => chain,
    orderBy: (clause: any) => {
      captured = new PgDialect().sqlToQuery(clause).sql;
      return Promise.resolve([]); // no rows: skips the document/rate lookups
    },
  };
  const original = db.select;
  (db as any).select = () => chain;
  try {
    await adminRepository.findTutors(status);
  } finally {
    (db as any).select = original;
  }
  return captured;
}

describe('adminRepository.findTutors ordering', () => {
  it('PENDING is oldest first (FIFO)', async () => {
    assert.match(await orderByFor(VerificationStatus.PENDING), /"created_at" asc$/);
  });

  for (const status of [VerificationStatus.APPROVED, VerificationStatus.REJECTED, 'ALL', undefined] as const) {
    it(`${status ?? 'no filter'} is newest first`, async () => {
      assert.match(await orderByFor(status), /"created_at" desc$/);
    });
  }
});
