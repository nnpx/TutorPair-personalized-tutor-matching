import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createPoolConfig } from './client.config.js';
import { resolveMigrationConfig } from './migration.config.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const config = resolveMigrationConfig(process.env);
const caBundle = config.rdsCaBundle ? readFileSync(config.rdsCaBundle, 'utf8') : undefined;
const pool = new pg.Pool(createPoolConfig(config.databaseUrl, config.nodeEnv, caBundle, config.poolMax));
const db = drizzle(pool);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) });
    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
