import { createApp } from './app.js';
import { env } from './config/env.js';
import { startEmailWorker } from './workers/email-dispatch.worker.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 TutorPair API server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`📡 Allowed CORS origin: ${env.ALLOWED_ORIGIN}`);

  // Start background workers
  startEmailWorker();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
