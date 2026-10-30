/**
 * NOTE: This is an initial draft / baseline implementation.
 * It should be reviewed, tested, and revised when implementing the notification business logic.
 */
import { notificationRepository } from './notification.repository.js';
import type { DbExecutor } from '../../db/client.js';
import { NotificationEventType, EmailStatus } from '@tutorpair/shared';

export interface CreateNotificationParams {
  userId: string;
  eventType: NotificationEventType;
  message: string;
  requiresEmail?: boolean;
}

export const notificationService = {
  // Pass `executor` (a transaction) to save the notification atomically with a business change.
  createNotification: async (
    { userId, eventType, message, requiresEmail = false }: CreateNotificationParams,
    executor?: DbExecutor
  ) => {
    return notificationRepository.create({
      user_id: userId,
      event_type: eventType,
      message,
      is_read: false,
      requires_email: requiresEmail,
      email_status: requiresEmail ? EmailStatus.PENDING : EmailStatus.NONE,
    }, executor);
  },

  getUserNotifications: async (userId: string, unreadOnly = false) => {
    return notificationRepository.findByUserId(userId, unreadOnly);
  },

  markAsRead: async (id: string, userId: string) => {
    return notificationRepository.markAsRead(id, userId);
  },
};
