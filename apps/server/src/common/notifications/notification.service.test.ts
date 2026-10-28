import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EmailStatus, NotificationEventType } from '@tutorpair/shared';
import { notificationService } from './notification.service.js';
import { notificationRepository } from './notification.repository.js';

describe('notificationService.createNotification (TP-9: joins the caller transaction)', () => {
  const originalCreate = notificationRepository.create;
  let calls: Array<{ data: Record<string, unknown>; executor: unknown; argCount: number }>;

  beforeEach(() => {
    calls = [];
    notificationRepository.create = (async (...args: unknown[]) => {
      calls.push({
        data: args[0] as Record<string, unknown>,
        executor: args[1],
        argCount: args.length,
      });
      return { id: 'n-1' };
    }) as unknown as typeof notificationRepository.create;
  });

  afterEach(() => {
    notificationRepository.create = originalCreate;
  });

  const params = {
    userId: 'tutor-1',
    eventType: NotificationEventType.TUTOR_SELECTED,
    message: 'hello',
    requiresEmail: true,
  };

  it('passes the transaction executor through to the repository', async () => {
    const tx = { marker: 'tx' };
    await notificationService.createNotification(params, tx as never);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].executor, tx);
  });

  it('keeps existing callers unchanged: no executor means the repository default is used', async () => {
    await notificationService.createNotification(params);
    assert.equal(calls[0].executor, undefined);
  });

  it('queues an email when requiresEmail is true', async () => {
    await notificationService.createNotification(params);
    assert.equal(calls[0].data.requires_email, true);
    assert.equal(calls[0].data.email_status, EmailStatus.PENDING);
    assert.equal(calls[0].data.is_read, false);
    assert.equal(calls[0].data.user_id, 'tutor-1');
    assert.equal(calls[0].data.event_type, NotificationEventType.TUTOR_SELECTED);
  });

  it('does not queue an email when requiresEmail is omitted', async () => {
    await notificationService.createNotification({ ...params, requiresEmail: undefined });
    assert.equal(calls[0].data.requires_email, false);
    assert.equal(calls[0].data.email_status, EmailStatus.NONE);
  });
});
