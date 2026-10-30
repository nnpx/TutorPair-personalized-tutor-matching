import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { errorHandler } from './error-handler.js';
import { BadRequestError, ConflictError, NotFoundError } from './http-errors.js';

function run(err: Error) {
  const out: { status?: number; body?: Record<string, unknown> } = {};
  const res = {
    status(code: number) {
      out.status = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      out.body = body;
      return this;
    },
  } as unknown as Response;
  errorHandler(err, {} as Request, res, () => undefined);
  return out;
}

const withProps = (message: string, props: Record<string, unknown>) =>
  Object.assign(new Error(message), props);

describe('errorHandler: global error template', () => {
  it('maps AppError subclasses to their status with the standard envelope', () => {
    const out = run(new NotFoundError('Match request not found'));
    assert.equal(out.status, 404);
    assert.equal(out.body?.success, false);
    assert.equal(out.body?.message, 'Match request not found');
  });

  it('forwards validation details on BadRequestError', () => {
    const details = [{ field: 'variant_id', message: 'Required' }];
    const out = run(new BadRequestError('Request validation failed', details));
    assert.equal(out.status, 400);
    assert.deepEqual(out.body?.details, details);
  });

  it('maps ConflictError to 409', () => {
    assert.equal(run(new ConflictError('already confirmed')).status, 409);
  });

  it('maps a malformed JSON body to 400', () => {
    const out = run(withProps('Unexpected token', { type: 'entity.parse.failed', status: 400 }));
    assert.equal(out.status, 400);
    assert.equal(out.body?.message, 'Malformed JSON in request body');
  });

  it('maps a body over the size limit to 413, not 500', () => {
    const out = run(withProps('request entity too large', { type: 'entity.too.large', status: 413 }));
    assert.equal(out.status, 413);
    assert.equal(out.body?.success, false);
    assert.match(String(out.body?.message), /too large/i);
  });

  it('maps Postgres invalid-uuid (22P02) to 400', () => {
    assert.equal(run(withProps('bad uuid', { code: '22P02' })).status, 400);
  });

  it('maps Postgres unique violation (23505) to 409', () => {
    assert.equal(run(withProps('dup', { code: '23505' })).status, 409);
  });

  it('maps Postgres foreign-key violation (23503) to 400', () => {
    assert.equal(run(withProps('fk', { code: '23503' })).status, 400);
  });

  // Drizzle 0.45 wraps every failed query in DrizzleQueryError; the Postgres error is its `cause`.
  describe('Postgres errors wrapped by Drizzle (error.cause)', () => {
    const wrapped = (code: string) =>
      Object.assign(new Error('Failed query: insert into ...'), {
        cause: Object.assign(new Error('pg error'), { code }),
      });

    it('maps a wrapped 22P02 to 400', () => {
      assert.equal(run(wrapped('22P02')).status, 400);
    });

    it('maps a wrapped 23505 to 409', () => {
      assert.equal(run(wrapped('23505')).status, 409);
    });

    it('maps a wrapped 23503 to 400', () => {
      assert.equal(run(wrapped('23503')).status, 400);
    });

    it('still returns 500 for a wrapped error with an unmapped code', () => {
      const originalError = console.error;
      console.error = () => undefined;
      try {
        assert.equal(run(wrapped('ECONNREFUSED')).status, 500);
      } finally {
        console.error = originalError;
      }
    });
  });

  it('falls back to 500 with the standard envelope for unknown errors', () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const out = run(new Error('boom'));
      assert.equal(out.status, 500);
      assert.equal(out.body?.success, false);
      assert.equal(typeof out.body?.message, 'string');
    } finally {
      console.error = originalError;
    }
  });
});
