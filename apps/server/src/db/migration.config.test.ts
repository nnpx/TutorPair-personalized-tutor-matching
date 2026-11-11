import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveMigrationConfig } from './migration.config.js';

const remoteUrl = 'postgresql://migrator:secret@db.example.internal:5432/tutorpair';

test('migration configuration accepts only database settings in production', () => {
  assert.deepEqual(resolveMigrationConfig({
    NODE_ENV: 'production',
    DATABASE_URL: remoteUrl,
    RDS_CA_BUNDLE: '/app/rds-ca.pem',
  }), {
    nodeEnv: 'production',
    databaseUrl: remoteUrl,
    rdsCaBundle: '/app/rds-ca.pem',
    poolMax: 2,
  });
});

test('production migration rejects missing credentials, local hosts, and missing CA trust', () => {
  assert.throws(() => resolveMigrationConfig({ NODE_ENV: 'production', RDS_CA_BUNDLE: '/app/rds-ca.pem' }), /DATABASE_URL/);
  assert.throws(() => resolveMigrationConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://migrator:secret@localhost/tutorpair', RDS_CA_BUNDLE: '/app/rds-ca.pem' }), /remote DATABASE_URL/);
  assert.throws(() => resolveMigrationConfig({ NODE_ENV: 'production', DATABASE_URL: remoteUrl }), /RDS_CA_BUNDLE/);
});

test('local migration keeps the existing development database default', () => {
  const config = resolveMigrationConfig({});
  assert.equal(config.databaseUrl, 'postgresql://postgres:postgres@localhost:5432/tutorpair');
  assert.equal(config.nodeEnv, 'development');
});
