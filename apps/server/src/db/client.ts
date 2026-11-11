import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import { readFileSync } from 'node:fs';
import * as schema from './schema/index.js';
import { createPoolConfig } from './client.config.js';

const { Pool } = pg;
const caBundle = env.RDS_CA_BUNDLE ? readFileSync(env.RDS_CA_BUNDLE, 'utf8') : undefined;
export const pool = new Pool(createPoolConfig(env.DATABASE_URL, env.NODE_ENV, caBundle, env.DB_POOL_MAX));

pool.on('error', (error) => console.error('[db] Unexpected idle client error', error));

export const db = drizzle(pool, { schema });

/** Either the shared db or an open transaction handle, so a write can join a caller's transaction. */
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
