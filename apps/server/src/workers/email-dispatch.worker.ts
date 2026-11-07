import { SESClient } from '@aws-sdk/client-ses';
import { createSesEmailTransport } from '../common/notifications/email-ses.transport.js';
import { EmailSendError } from '../common/notifications/email-errors.js';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { env } from '../config/env.js';
import { previewEmailQueue, sesEmailQueue, type EmailQueue, type EmailJob } from '../common/notifications/email.repository.js';
import { createFileEmailTransport } from '../common/notifications/email-preview.transport.js';
export type EmailTransport = (job: EmailJob, signal: AbortSignal) => Promise<void>;
const RETRY_SECONDS = [30, 120, 600, 1800, 1800];
/** Single-process overlap protection plus database-owned leases for concurrent processes. */
export function createEmailWorker(queue: EmailQueue, send: EmailTransport, timeoutMs = 10_000) {
  let running: Promise<void> | null = null;
  let stopping = false;
  function tick(): Promise<void> {
    if (stopping) return Promise.resolve();
    if (running) return running;
    const owner = randomUUID();
    running = (async () => {
      const jobs = await queue.claim(owner);
      const results = await Promise.allSettled(jobs.map(async job => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([send(job, controller.signal), new Promise<never>((_, reject) => {
            timer = setTimeout(() => { controller.abort(); reject(new Error('Email timeout')); }, timeoutMs);
          })]);
          if (!await queue.complete(job.id, owner)) console.warn('[email] Stale claim; completion ignored');
        } catch (error) {
          await queue.fail(job.id, owner, RETRY_SECONDS[Math.min(job.attempt_count - 1, 4)] ?? 1800, error instanceof EmailSendError && !error.retryable);
        } finally { clearTimeout(timer); }
      }));
      if (results.some(result => result.status === 'rejected')) throw new Error('Email queue update failed');
    })().finally(() => { running = null; });
    return running;
  }
  return { tick, async stop() { stopping = true; await running; } };
}
export function startEmailWorker() {
  if (env.EMAIL_MODE === 'disabled') {
    console.log('[email] Worker disabled; no database writes or emails');
    return async () => {};
  }
  let closeTransport = () => {};
  let queue: EmailQueue;
  let send: EmailTransport;
  if (env.EMAIL_MODE === 'ses') {
    const client = new SESClient({ region: env.AWS_REGION, maxAttempts: 1 });
    closeTransport = () => client.destroy();
    queue = sesEmailQueue;
    send = createSesEmailTransport((command, options) => client.send(command, options), { from: env.SES_FROM_EMAIL, portalUrl: env.TUTOR_PORTAL_URL });
  } else {
    const target = new URL(env.DATABASE_URL);
    if (env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
      throw new Error('Local email previews require a local database in development/test');
    }
    queue = previewEmailQueue;
    send = createFileEmailTransport(resolve(env.EMAIL_PREVIEW_DIR), env.TUTOR_PORTAL_URL);
  }
  const worker = createEmailWorker(queue, send);
  const timer = setInterval(() => { void worker.tick().catch(() => console.error('[email] Queue processing failed; check database availability')); }, 30_000);
  console.log(env.EMAIL_MODE === 'ses' ? '[email] SES delivery enabled' : '[email] Local preview worker enabled; no external delivery');
  return async () => { clearInterval(timer); try { await worker.stop(); } finally { closeTransport(); } };
}
