/**
 * NOTE: This is an initial draft / baseline implementation.
 * It should be reviewed, tested, and revised when implementing the notification database layer.
 */
import { db, type DbExecutor } from '../../db/client.js';
import { notifications, NewNotification } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { EmailStatus } from '@tutorpair/shared';

export const notificationRepository = {
  create: async (data: NewNotification, executor: DbExecutor = db) => {
    const [row] = await executor.insert(notifications).values(data).returning();
    return row;
  },

  findByUserId: async (userId: string, unreadOnly = false) => {
    const conditions = [eq(notifications.user_id, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.is_read, false));
    }
    return db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(notifications.created_at);
  },

  markAsRead: async (id: string, userId: string) => {
    const [updated] = await db
      .update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.id, id), eq(notifications.user_id, userId)))
      .returning();
    return updated;
  },

  markAllAsRead: async (userId: string) => {
    const rows = await db.update(notifications).set({ is_read: true })
      .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)))
      .returning({ id: notifications.id });
    return rows.length;
  },

  getPendingEmails: async (limit = 10) => {
    return db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.requires_email, true),
          eq(notifications.email_status, EmailStatus.PENDING)
        )
      )
      .limit(limit);
  },

  updateEmailStatus: async (id: string, status: EmailStatus, sentAt: Date | null = null) => {
    return db
      .update(notifications)
      .set({
        email_status: status,
        email_sent_at: sentAt,
      })
      .where(eq(notifications.id, id));
  },
};
