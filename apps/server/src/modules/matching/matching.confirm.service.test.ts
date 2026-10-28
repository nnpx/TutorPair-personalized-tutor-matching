import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MatchRequestStatus, NotificationEventType, VerificationStatus } from '@tutorpair/shared';
import { matchingService } from './matching.service.js';
import { matchingRepository } from './matching.repository.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../common/errors/http-errors.js';

const STUDENT = 'student-1';
const OTHER_STUDENT = 'student-2';
const REQUEST_ID = '0b9c7f52-1d2e-4f3a-8b4c-5d6e7f8a9b0c';
const REC_ID = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const TUTOR_ID = 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f';
const TX = { marker: 'tx' };

describe('MatchingService.confirmSelection (TP-9)', () => {
  const orig = {
    transaction: matchingRepository.transaction,
    lock: matchingRepository.lockRequest,
    findRec: matchingRepository.findRecommendation,
    tutorStatus: matchingRepository.findTutorVerificationStatus,
    markSelected: matchingRepository.markSelected,
    notify: notificationService.createNotification,
  };

  let log: string[];
  let committed: boolean;
  let txOpened: boolean;
  let notified: Array<{ params: Record<string, unknown>; executor: unknown }>;
  let request: { id: string; student_id: string; status: string } | null;
  let recommendation: { id: string; tutor_id: string } | null;
  let tutorStatus: string | null;

  beforeEach(() => {
    log = [];
    committed = false;
    txOpened = false;
    notified = [];
    request = { id: REQUEST_ID, student_id: STUDENT, status: MatchRequestStatus.PENDING };
    recommendation = { id: REC_ID, tutor_id: TUTOR_ID };
    tutorStatus = VerificationStatus.APPROVED;

    // A "transaction" that only counts as committed when the callback resolves.
    matchingRepository.transaction = (async (fn: (tx: unknown) => Promise<unknown>) => {
      txOpened = true;
      const result = await fn(TX);
      committed = true;
      return result;
    }) as unknown as typeof matchingRepository.transaction;
    matchingRepository.lockRequest = (async () => {
      log.push('lock');
      return request;
    }) as unknown as typeof matchingRepository.lockRequest;
    matchingRepository.findRecommendation = (async () => {
      log.push('findRecommendation');
      return recommendation;
    }) as unknown as typeof matchingRepository.findRecommendation;
    matchingRepository.findTutorVerificationStatus = (async () => {
      log.push('tutorStatus');
      return tutorStatus;
    }) as unknown as typeof matchingRepository.findTutorVerificationStatus;
    matchingRepository.markSelected = (async () => {
      log.push('markSelected');
    }) as unknown as typeof matchingRepository.markSelected;
    notificationService.createNotification = (async (
      params: Record<string, unknown>,
      executor: unknown
    ) => {
      log.push('notify');
      notified.push({ params, executor });
      return { id: 'n-1' };
    }) as unknown as typeof notificationService.createNotification;
  });

  afterEach(() => {
    matchingRepository.transaction = orig.transaction;
    matchingRepository.lockRequest = orig.lock;
    matchingRepository.findRecommendation = orig.findRec;
    matchingRepository.findTutorVerificationStatus = orig.tutorStatus;
    matchingRepository.markSelected = orig.markSelected;
    notificationService.createNotification = orig.notify;
  });

  const confirm = (over: Partial<{ studentId: string; id: string; rec: string; tutor: string }> = {}) =>
    matchingService.confirmSelection(over.studentId ?? STUDENT, over.id ?? REQUEST_ID, {
      recommendation_id: over.rec ?? REC_ID,
      tutor_id: over.tutor ?? TUTOR_ID,
    });

  it('throws NotFoundError for an unknown request', async () => {
    request = null;
    await assert.rejects(confirm(), NotFoundError);
    assert.deepEqual(notified, []);
  });

  it('throws NotFoundError (not Forbidden) when the request belongs to another student', async () => {
    await assert.rejects(confirm({ studentId: OTHER_STUDENT }), NotFoundError);
    assert.deepEqual(notified, []);
    assert.equal(log.includes('markSelected'), false);
  });

  it('returns the same message for unknown and not-owned requests (no existence leak)', async () => {
    request = null;
    const unknown = await confirm().catch((e: Error) => e.message);
    request = { id: REQUEST_ID, student_id: STUDENT, status: MatchRequestStatus.PENDING };
    const notOwned = await confirm({ studentId: OTHER_STUDENT }).catch((e: Error) => e.message);
    assert.equal(unknown, notOwned);
  });

  it('throws NotFoundError for a malformed request id without opening a transaction', async () => {
    await assert.rejects(confirm({ id: 'not-a-uuid' }), NotFoundError);
    assert.equal(txOpened, false);
  });

  it('throws ConflictError when the request is already confirmed', async () => {
    request = { id: REQUEST_ID, student_id: STUDENT, status: MatchRequestStatus.CONFIRMED };
    await assert.rejects(confirm(), ConflictError);
    assert.deepEqual(notified, []);
    assert.equal(log.includes('markSelected'), false);
  });

  it('throws NotFoundError when the recommendation is not part of this request', async () => {
    recommendation = null;
    await assert.rejects(confirm(), NotFoundError);
    assert.deepEqual(notified, []);
  });

  it('throws UnprocessableEntityError when tutor_id is not the recommendation tutor', async () => {
    await assert.rejects(confirm({ tutor: 'someone-else' }), UnprocessableEntityError);
    assert.deepEqual(notified, []);
    assert.equal(log.includes('markSelected'), false);
  });

  it('throws UnprocessableEntityError when the tutor is no longer approved', async () => {
    tutorStatus = VerificationStatus.REJECTED;
    await assert.rejects(
      confirm(),
      (err: unknown) =>
        err instanceof UnprocessableEntityError && /no longer available/i.test((err as Error).message)
    );
    assert.deepEqual(notified, []);
    assert.equal(log.includes('markSelected'), false);
  });

  it('throws UnprocessableEntityError when the tutor record is gone', async () => {
    tutorStatus = null;
    await assert.rejects(confirm(), UnprocessableEntityError);
  });

  it('on success locks first, selects exactly one recommendation, then notifies the tutor', async () => {
    const result = await confirm();
    assert.deepEqual(log, ['lock', 'findRecommendation', 'tutorStatus', 'markSelected', 'notify']);
    assert.equal(committed, true);
    assert.deepEqual(result, {
      match_request_id: REQUEST_ID,
      status: MatchRequestStatus.CONFIRMED,
      selected: { recommendation_id: REC_ID, tutor_id: TUTOR_ID },
    });
  });

  it('creates a TUTOR_SELECTED notification with an email, inside the same transaction', async () => {
    await confirm();
    assert.equal(notified.length, 1);
    assert.deepEqual(notified[0].params, {
      userId: TUTOR_ID,
      eventType: NotificationEventType.TUTOR_SELECTED,
      message: 'A student has selected you as their tutor. Please check your contact details.',
      requiresEmail: true,
    });
    assert.equal(notified[0].executor, TX);
  });

  it('does not return contact details', async () => {
    const json = JSON.stringify(await confirm());
    for (const forbidden of ['phone_number', 'line_id', 'email']) {
      assert.equal(json.includes(forbidden), false, `${forbidden} leaked`);
    }
  });

  it('does not commit when creating the notification fails (selection rolls back with it)', async () => {
    notificationService.createNotification = (async () => {
      throw new Error('db down');
    }) as unknown as typeof notificationService.createNotification;
    await assert.rejects(confirm(), /db down/);
    assert.equal(committed, false);
  });
});
