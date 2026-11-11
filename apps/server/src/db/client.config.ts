import type { PoolConfig } from 'pg';

const sslUrlOptions = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslpassword'];

/**
 * pg parses connectionString after merging the explicit options, allowing URL SSL
 * parameters to override the supplied TLS object. Strip those parameters in prod.
 */
export function createPoolConfig(
  databaseUrl: string,
  nodeEnv: string,
  rdsCaBundle?: string,
  poolMax = 10
): PoolConfig {
  const production = nodeEnv === 'production';
  let connectionString = databaseUrl;
  let ssl: PoolConfig['ssl'];
  if (production) {
    if (!rdsCaBundle) throw new Error('Production PostgreSQL connections require the RDS CA bundle');
    const parsed = new URL(databaseUrl);
    for (const option of sslUrlOptions) parsed.searchParams.delete(option);
    connectionString = parsed.toString();
    ssl = { rejectUnauthorized: true, ca: rdsCaBundle };
  }

  return {
    connectionString,
    max: poolMax,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 5_000,
    statement_timeout: 5_000,
    ...(production ? { ssl } : {}),
  };
}
