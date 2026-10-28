import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MatchRequestSchema,
  ConfirmTutorSelectionSchema,
  MatchRequestStatus,
} from '@tutorpair/shared';

const UUID = '3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b';

describe('MatchRequestSchema (TP-8)', () => {
  it('accepts a body that only carries variant_id', () => {
    assert.deepEqual(MatchRequestSchema.parse({ variant_id: UUID }), { variant_id: UUID });
  });

  it('rejects a missing variant_id', () => {
    assert.equal(MatchRequestSchema.safeParse({}).success, false);
  });

  it('rejects a non-uuid variant_id', () => {
    assert.equal(MatchRequestSchema.safeParse({ variant_id: 'x' }).success, false);
  });

  it('drops profile-derived fields so clients cannot override the stored profile', () => {
    const parsed = MatchRequestSchema.parse({
      variant_id: UUID,
      budget_max: 1,
      grade_level: 'G1',
      style_profile: [1, 1, 1, 1, 1],
    });
    assert.deepEqual(parsed, { variant_id: UUID });
  });
});

describe('ConfirmTutorSelectionSchema (TP-9 contract)', () => {
  it('requires uuid recommendation_id and tutor_id', () => {
    assert.equal(
      ConfirmTutorSelectionSchema.safeParse({ recommendation_id: UUID, tutor_id: UUID }).success,
      true
    );
    assert.equal(ConfirmTutorSelectionSchema.safeParse({ tutor_id: UUID }).success, false);
  });
});

describe('MatchRequestStatus', () => {
  it('has exactly PENDING and CONFIRMED', () => {
    assert.deepEqual(Object.values(MatchRequestStatus).sort(), ['CONFIRMED', 'PENDING']);
  });
});
