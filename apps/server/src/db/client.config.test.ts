import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createPoolConfig } from './client.config.js';

describe('PostgreSQL pool configuration', () => {
  it('keeps verified RDS TLS enabled when DATABASE_URL contains disabling SSL parameters', () => {
    const options = createPoolConfig(
      'postgresql://user:pass@db.example.com:5432/tutorpair?sslmode=disable&sslrootcert=%2Ftmp%2Funtrusted.pem',
      'production',
      'test RDS CA',
      7
    );
    const client = new pg.Client(options) as pg.Client & {
      connectionParameters: { ssl: boolean | { rejectUnauthorized?: boolean; ca?: string } };
    };
    assert.equal(new URL(options.connectionString!).searchParams.has('sslmode'), false);
    assert.equal(new URL(options.connectionString!).searchParams.has('sslrootcert'), false);
    assert.equal(typeof client.connectionParameters.ssl, 'object');
    assert.equal((client.connectionParameters.ssl as { rejectUnauthorized?: boolean }).rejectUnauthorized, true);
    assert.equal((client.connectionParameters.ssl as { ca?: string }).ca, 'test RDS CA');
    assert.equal(client.connectionParameters.ssl, options.ssl);
    assert.equal(options.max, 7);
  });

  it('ignores ssl=no-verify and ssl=false URL parameters in production', () => {
    for (const sslValue of ['no-verify', 'false']) {
      const options = createPoolConfig(
        `postgresql://user:pass@db.example.com:5432/tutorpair?ssl=${sslValue}`,
        'production',
        'test RDS CA'
      );
      const client = new pg.Client(options) as pg.Client & {
        connectionParameters: { ssl: boolean | { rejectUnauthorized?: boolean; ca?: string } };
      };

      assert.equal(new URL(options.connectionString!).searchParams.has('ssl'), false);
      assert.equal(typeof client.connectionParameters.ssl, 'object', `ssl=${sslValue}`);
      assert.equal((client.connectionParameters.ssl as { rejectUnauthorized?: boolean }).rejectUnauthorized, true);
      assert.equal((client.connectionParameters.ssl as { ca?: string }).ca, 'test RDS CA');
    }
  });

  it('requires a CA bundle for production and preserves local connection settings', () => {
    assert.throws(
      () => createPoolConfig('postgresql://localhost/tutorpair', 'production'),
      /RDS CA bundle/
    );
    const local = createPoolConfig(
      'postgresql://localhost/tutorpair?sslmode=disable',
      'development'
    );
    assert.equal(local.connectionString, 'postgresql://localhost/tutorpair?sslmode=disable');
    assert.equal(local.ssl, undefined);
  });
});
