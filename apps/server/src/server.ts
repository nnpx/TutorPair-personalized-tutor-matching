import { createApp } from './app.js';
import { pool } from './db/client.js';
import { env } from './config/env.js';
import { startEmailWorker } from './workers/email-dispatch.worker.js';

const app = createApp();

let stopEmailWorker: () => Promise<void> = async () => {};
const server = app.listen(env.PORT, () => {
  console.log(`🚀 TutorPair API server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`📡 Allowed CORS origin: ${env.ALLOWED_ORIGIN}`);

  // Start background workers
  stopEmailWorker = startEmailWorker();
});

// Stop claims before closing database connections; worker sends have bounded timeouts.
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 15_000);
  deadline.unref();
  const httpClosed = new Promise<void>(resolve => server.close(() => resolve()));
  await Promise.all([stopEmailWorker(), httpClosed]);
  await pool.end();
  clearTimeout(deadline);
}
process.on('SIGTERM', () => { void shutdown(); });
process.on('SIGINT', () => { void shutdown(); });
