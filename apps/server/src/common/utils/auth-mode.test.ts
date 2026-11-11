import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMockTokenAllowed } from './auth-mode.js';

describe('authentication mode', () => {
  it('allows mock authentication only in development and test', () => {
    assert.equal(isMockTokenAllowed('development', 'mock-token-student'), true);
    assert.equal(isMockTokenAllowed('test', 'mock-token-student'), true);
    assert.equal(isMockTokenAllowed('production', 'mock-token-student'), false);
    assert.equal(isMockTokenAllowed('development', 'real.jwt.token'), false);
  });
});
