import { notificationRepository } from './notification.repository.js';
import { NotificationEventType, EmailStatus } from '@tutorpair/shared';

export interface CreateNotificationParams {
  userId: string;
  eventType: NotificationEventType;
  message: string;
  requiresEmail?: boolean;
}

export const notificationService = {
  createNotification: async ({
    userId,
    eventType,
    message,
    requiresEmail = false,
  }: CreateNotificationParams) => {
    return notificationRepository.create({
      user_id: userId,
      event_type: eventType,
      message,
      is_read: false,
      requires_email: requiresEmail,
      email_status: requiresEmail ? EmailStatus.PENDING : EmailStatus.NONE,
    });
  },

  getUserNotifications: async (userId: string, unreadOnly = false) => {
    return notificationRepository.findByUserId(userId, unreadOnly);
  },

  markAsRead: async (id: string, userId: string) => {
    return notificationRepository.markAsRead(id, userId);
  },
};
