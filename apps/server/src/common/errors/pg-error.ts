/**
 * Returns the Postgres/driver error code of `err`, looking through `cause`.
 * Drizzle wraps every failed query in DrizzleQueryError and keeps the original pg error
 * (the one carrying `code`, e.g. '23503') in `cause`, so checking only the top-level error misses it.
 */
export function getPgErrorCode(err: unknown): string | undefined {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string') return code;
    current = cause;
  }
  return undefined;
}

export const PG_FOREIGN_KEY_VIOLATION = '23503';
