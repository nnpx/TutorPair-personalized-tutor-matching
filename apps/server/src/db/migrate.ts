import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';
import { fileURLToPath } from 'node:url';

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
