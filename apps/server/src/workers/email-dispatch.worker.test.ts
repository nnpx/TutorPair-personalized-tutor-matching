import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEmailWorker } from './email-dispatch.worker.js';
import type { EmailJob, EmailQueue } from '../common/notifications/email.repository.js';
import { createFileEmailTransport } from '../common/notifications/email-preview.transport.js';
import { renderNotificationEmail } from '../common/notifications/email-template.js';
const job: EmailJob = { id: '00000000-0000-4000-8000-000000000001', email: 'tutor@example.test', event_type: 'TUTOR_SELECTED', message: 'Selected', attempt_count: 1 };
function queue() {
  const state = { claims: 0, completions: 0, failures: [] as number[] };
  const repository: EmailQueue = {
    claim: async () => { state.claims++; return [job]; },
    complete: async () => { state.completions++; return true; },
    fail: async (_id, _owner, delay) => { state.failures.push(delay); },
  };
  return { state, repository };
}
test('overlapping ticks share one claim and shutdown stops future polls', async () => {
  const { state, repository } = queue();
  let finish!: () => void;
  const worker = createEmailWorker(repository, () => new Promise<void>(resolve => { finish = resolve; }));
  const first = worker.tick(); const second = worker.tick();
  assert.equal(first, second);
  await new Promise<void>(resolve => setImmediate(resolve));
  finish(); await Promise.all([first, second]); await worker.stop(); await worker.tick();
  assert.equal(state.claims, 1); assert.equal(state.completions, 1);
});
test('send failures schedule retry; completion is never recorded', async () => {
  const { state, repository } = queue();
  await createEmailWorker(repository, async () => { throw new Error('Unavailable'); }).tick();
  assert.deepEqual(state.failures, [30]); assert.equal(state.completions, 0);
});
test('timed-out transport is aborted and queued for retry', async () => {
  const { state, repository } = queue(); let aborted = false;
  await createEmailWorker(repository, (_job, signal) => new Promise<void>(() => {
    signal.addEventListener('abort', () => { aborted = true; });
  }), 5).tick();
  assert.equal(aborted, true); assert.deepEqual(state.failures, [30]);
});
test('local worker creates actual email files with approved copy without a database or email provider', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tutorpair-email-test-'));
  try {
    const { state, repository } = queue();
    await createEmailWorker(repository, createFileEmailTransport(directory, 'http://localhost:5180/tutor/profile')).tick();
    assert.equal(state.completions, 1);
    assert.equal((await readdir(directory)).length, 2);
    const output = JSON.parse(await readFile(join(directory, `${job.id}.json`), 'utf8'));
    assert.equal(output.preview, true); assert.equal(output.to, job.email);
    assert.match(output.html, /A student has selected you as their tutor/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('approval/rejection emails render safely, unsupported events fail explicitly', () => {
  const email = renderNotificationEmail('VERIFICATION_REJECTED', '<script>unsafe</script>', 'http://localhost:5180/tutor/profile');
  assert.match(email.html, /&lt;script&gt;/); assert.doesNotMatch(email.html, /<script>/);
  assert.match(renderNotificationEmail('VERIFICATION_APPROVED', 'Approved', 'http://localhost:5180').subject, /approved/);
  assert.throws(() => renderNotificationEmail('UNKNOWN', '', 'http://localhost:5180'));
});
test('shutdown waits for other sends even if one job cannot record its retry', async () => {
  const { repository } = queue();
  repository.claim = async () => [job, { ...job, id: '00000000-0000-4000-8000-000000000002' }];
  repository.fail = async () => { throw new Error('Database unavailable'); };
  let finish!: () => void;
  let sent = false;
  const worker = createEmailWorker(repository, async j => {
    if (j.id === job.id) throw new Error('Send failed');
    await new Promise<void>(resolve => { finish = resolve; });
    sent = true;
  });
  const tick = worker.tick();
  const rejected = assert.rejects(tick, /queue update failed/);
  await new Promise<void>(resolve => setImmediate(resolve));
  const stopped = worker.stop();
  const stopRejected = assert.rejects(stopped, /queue update failed/);
  assert.equal(sent, false); finish();
  await Promise.all([rejected, stopRejected]); assert.equal(sent, true);
});
