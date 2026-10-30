import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EmailJob } from './email.repository.js';
import { renderNotificationEmail } from './email-template.js';
/** Local files only. Notification IDs form stable names so retries replace the same preview. */
export function createFileEmailTransport(directory: string, portalUrl: string) {
  return async (job: EmailJob, signal: AbortSignal) => {
    if (!/^[0-9a-f-]{36}$/i.test(job.id)) throw new Error('Invalid preview ID');
    const email = renderNotificationEmail(job.event_type, job.message, portalUrl);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${job.id}.html`), email.html, { signal, mode: 0o600 });
    await writeFile(join(directory, `${job.id}.json`), JSON.stringify({ preview: true, to: job.email, ...email }, null, 2), { signal, mode: 0o600 });
  };
}
