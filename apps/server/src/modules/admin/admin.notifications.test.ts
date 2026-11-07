import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminService } from './admin.service.js';
import { adminRepository } from './admin.repository.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import { VerificationStatus } from '@tutorpair/shared';

test('admin decision notifies inside the transaction, repeats do nothing, errors propagate for rollback', async () => {
  const originals = { transaction: adminRepository.transaction, lock: adminRepository.lockTutor, save: adminRepository.saveVerification, notify: notificationService.createNotification };
  const tx = {} as never;
  let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  let notices = 0;
  let simulateFailure = false;
  adminRepository.transaction = async work => work(tx);
  adminRepository.lockTutor = async () => ({ verification_status: status, rejection_reason: null } as never);
  adminRepository.saveVerification = async (_tx, _id, next) => ({ verification_status: next, rejection_reason: null } as never);
  notificationService.createNotification = async (params, executor) => {
    assert.equal(executor, tx); assert.equal(params.requiresEmail, true); notices++;
    if (simulateFailure) throw new Error('notification persistence failed');
    return {} as never;
  };
  try {
    await adminService.verifyTutor('tutor', { status: VerificationStatus.APPROVED });
    assert.equal(notices, 1);
    status = 'APPROVED';
    await adminService.verifyTutor('tutor', { status: VerificationStatus.APPROVED });
    assert.equal(notices, 1);
    simulateFailure = true;
    await assert.rejects(() => adminService.verifyTutor('tutor', { status: VerificationStatus.REJECTED, rejection_reason: 'Document is unreadable' }), /persistence failed/);
  } finally {
    adminRepository.transaction = originals.transaction; adminRepository.lockTutor = originals.lock;
    adminRepository.saveVerification = originals.save; notificationService.createNotification = originals.notify;
  }
});
