import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { notificationController } from './notification.controller.js';
import { notificationService } from './notification.service.js';
import { notificationRouter } from './notification.routes.js';
import { errorHandler } from '../errors/error-handler.js';
import { NotificationBodySchema, NotificationQuerySchema, UuidParamSchema, UserRole } from '@tutorpair/shared';
import type { AuthRequest } from '../middlewares/authenticate-jwt.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { requireRole } from '../middlewares/require-role.js';

test('notification HTTP contract without database access', async () => {
  const originalList = notificationService.getUserNotifications;
  const originalReadAll = notificationService.markAllAsRead;
  const originalRead = notificationService.markAsRead;
  const id = '00000000-0000-4000-8000-000000000001';
  const row = { id, user_id: 'tutor-a', event_type: 'TUTOR_SELECTED' as const, message: 'Selected', is_read: false, requires_email: true, email_status: 'PENDING' as const, email_sent_at: null, created_at: new Date('2026-10-27T00:00:00Z') };
  const calls: string[] = [];
  notificationService.getUserNotifications = async user => { calls.push(user); return [row]; };
  notificationService.markAsRead = async (notificationId, user) => {
    calls.push(user);
    return user === 'tutor-a' && notificationId === id ? { ...row, is_read: true } : undefined;
  };
  notificationService.markAllAsRead = async user => { calls.push(user); return 2; };
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  // Actual router must reject unauthenticated requests before touching PostgreSQL.
  app.use('/api/notifications', notificationRouter);
  // Controller/role contract with a test-only identity middleware; never mounted in the app.
  app.use('/contract', (req: AuthRequest, _res, next) => {
    req.user = { id: req.header('x-test-user') || 'tutor-a', role: req.header('x-test-role') || UserRole.TUTOR } as AuthRequest['user']; next();
  }, requireRole([UserRole.TUTOR]), validateRequest(NotificationQuerySchema, 'query'), validateRequest(NotificationBodySchema));
  app.get('/contract', notificationController.list);
  app.patch('/contract/read-all', notificationController.readAll);
  app.patch('/contract/:id/read', validateRequest(UuidParamSchema, 'params'), notificationController.read);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const [path, method] of [['', 'GET'], ['/read-all', 'PATCH'], [`/${id}/read`, 'PATCH']]) {
      assert.equal((await fetch(`${base}/api/notifications${path}`, { method })).status, 401);
      for (const role of ['STUDENT', 'ADMIN']) {
        assert.equal((await fetch(`${base}/contract${path}`, { method, headers: { 'x-test-role': role } })).status, 403);
      }
    }
    for (const [payload, expected] of [['{', 400], [JSON.stringify({ padding: 'x'.repeat(1_048_576) }), 413]] as const) {
      assert.equal((await fetch(`${base}/contract/read-all`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: payload })).status, expected);
    }

    assert.equal((await fetch(`${base}/contract`, { headers: { 'x-test-role': 'STUDENT' } })).status, 403);
    for (const method of ['GET', 'PATCH']) {
      const path = method === 'GET' ? '/contract' : '/contract/read-all';
      const invalidQuery = await fetch(base + path + '?user_id=other-tutor', { method });
      assert.equal(invalidQuery.status, 400);
      const error = await invalidQuery.json() as { success: boolean; message: string; details: unknown[] };
      assert.equal(error.success, false);
      assert.equal(error.message, 'Request validation failed');
      assert.ok(Array.isArray(error.details));
    }
    for (const body of [{ user_id: 'other-tutor' }, { is_read: false }, [], null]) {
      for (const path of ['/contract/read-all', `/contract/${id}/read`]) {
        assert.equal((await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, 400);
      }
    }
    assert.equal(calls.length, 0, 'invalid input must not invoke service/database');
    const response = await fetch(`${base}/contract`);
    const body = await response.json() as { data: { unreadCount: number; items: Array<Record<string, unknown>> } };
    assert.equal(body.data.unreadCount, 1);
    assert.equal(body.data.items[0].email_status, undefined);
    assert.equal(body.data.items[0].user_id, undefined);
    assert.equal((await fetch(`${base}/contract/bad/read`, { method: 'PATCH' })).status, 400);
    assert.equal((await fetch(`${base}/contract/${id}/read`, { method: 'PATCH', headers: { 'x-test-user': 'tutor-b' } })).status, 404);
    assert.equal((await fetch(`${base}/contract/${id}/read`, { method: 'PATCH' })).status, 200);
    const all = await fetch(`${base}/contract/read-all`, { method: 'PATCH' });
    assert.equal(all.status, 200);
    assert.deepEqual(calls, ['tutor-a', 'tutor-b', 'tutor-a', 'tutor-a']);
    notificationService.getUserNotifications = async () => { throw new Error('database unavailable'); };
    notificationService.markAsRead = async () => { throw new Error('database unavailable'); };
    notificationService.markAllAsRead = async () => { throw new Error('database unavailable'); };
    for (const [path, method] of [['/contract', 'GET'], ['/contract/read-all', 'PATCH'], [`/contract/${id}/read`, 'PATCH']]) {
      const failed = await fetch(base + path, { method });
      assert.equal(failed.status, 500);
      assert.equal((await failed.json() as { success: boolean }).success, false);
    }

  } finally {
    notificationService.markAllAsRead = originalReadAll;
    notificationService.getUserNotifications = originalList;
    notificationService.markAsRead = originalRead;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
