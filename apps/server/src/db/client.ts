import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/** Either the shared db or an open transaction handle, so a write can join a caller's transaction. */
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
