import { z } from 'zod';
import { AuthRequest } from '../middlewares/authenticate-jwt.js';
import { asyncHandler } from '../utils/async-handler.js';
import { successResponse } from '../utils/response.util.js';
import { BadRequestError, NotFoundError } from '../errors/http-errors.js';
import { notificationService } from './notification.service.js';
import type { TutorNotificationList } from '@tutorpair/shared';

export const notificationController = {
  list: asyncHandler(async (req: AuthRequest, res) => {
    const rows = await notificationService.getUserNotifications(req.user!.id);
    const result: TutorNotificationList = {
      items: [...rows].sort((a, b) => b.created_at.getTime() - a.created_at.getTime() || b.id.localeCompare(a.id)).map(row => ({
        id: row.id, event_type: row.event_type, message: row.message,
        is_read: row.is_read, created_at: row.created_at.toISOString(),
      })),
      unreadCount: rows.filter(row => !row.is_read).length,
    };
    res.json(successResponse(result));
  }),
  readAll: asyncHandler(async (req: AuthRequest, res) => {
    const updatedCount = await notificationService.markAllAsRead(req.user!.id);
    res.json(successResponse({ updatedCount }));
  }),
  read: asyncHandler(async (req: AuthRequest, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success) throw new BadRequestError('Invalid notification ID');
    const row = await notificationService.markAsRead(req.params.id, req.user!.id);
    if (!row) throw new NotFoundError('Notification not found');
    res.json(successResponse({ id: row.id, is_read: row.is_read }));
  }),
};
