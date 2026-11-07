import { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import { NotFoundError } from '../../common/errors/http-errors.js';

export const notificationsController = {
  getUserNotifications: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const unreadOnly = req.query.unread === 'true';
    const list = await notificationService.getUserNotifications(userId, unreadOnly);
    const unreadCount = list.filter((n) => !n.is_read).length;

    res.status(200).json(
      successResponse({
        notifications: list.map((n) => ({
          id: n.id,
          user_id: n.user_id,
          event_type: n.event_type,
          message: n.message,
          is_read: n.is_read,
          created_at: n.created_at.toISOString(),
        })),
        unread_count: unreadCount,
      })
    );
  }),

  markAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const id = req.params.id;
    const updated = await notificationService.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }
    res.status(200).json(successResponse({ id: updated.id, is_read: updated.is_read }, 'Notification marked as read'));
  }),

  markAllAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.status(200).json(successResponse(null, 'All notifications marked as read'));
  }),
};
