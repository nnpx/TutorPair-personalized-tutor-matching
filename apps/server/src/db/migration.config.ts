const localDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/tutorpair';

/** Migrations need database settings, not the API's Cognito, S3, or SES settings. */
export function resolveMigrationConfig(source: NodeJS.ProcessEnv) {
  const nodeEnv = source.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('Invalid NODE_ENV for database migration');
  }

  const databaseUrl = source.DATABASE_URL ?? (nodeEnv === 'production' ? '' : localDatabaseUrl);
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('Database migration requires a valid DATABASE_URL');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || !parsed.username) {
    throw new Error('Database migration requires a PostgreSQL DATABASE_URL with a host and user');
  }

  if (nodeEnv === 'production') {
    if (!source.DATABASE_URL || !parsed.password || ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
      throw new Error('Production migration requires a remote DATABASE_URL with a password');
    }
    if (!source.RDS_CA_BUNDLE) {
      throw new Error('Production migration requires RDS_CA_BUNDLE');
    }
  }

  const poolMax = Number(source.DB_POOL_MAX ?? 2);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 50) {
    throw new Error('DB_POOL_MAX must be an integer from 1 to 50');
  }

  return { databaseUrl, nodeEnv, rdsCaBundle: source.RDS_CA_BUNDLE, poolMax };
}
