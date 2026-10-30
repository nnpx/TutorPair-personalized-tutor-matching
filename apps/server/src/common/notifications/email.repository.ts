import { pool } from '../../db/client.js';
export interface EmailJob { id: string; email: string; event_type: string; message: string; attempt_count: number }
export interface EmailQueue {
  claim(owner: string): Promise<EmailJob[]>;
  complete(id: string, owner: string): Promise<boolean>;
  fail(id: string, owner: string, delaySeconds: number, terminal?: boolean): Promise<void>;
}
/** Mode is part of the primary key: a local preview cannot suppress SES delivery. */
export function createEmailQueue(mode: 'preview' | 'ses'): EmailQueue {
  return {
    async claim(owner) {
      await pool.query(`INSERT INTO email_deliveries (notification_id, mode)
        SELECT id, $1 FROM notifications WHERE requires_email = true AND email_status = 'PENDING'
        ON CONFLICT DO NOTHING`, [mode]);
      // A process may die during its final attempt. Record terminal failure after that lease expires.
      await pool.query(`WITH exhausted AS (
        UPDATE email_deliveries SET owner = NULL, lease_expires_at = NULL, last_error = 'Email attempts exhausted'
        WHERE mode = $1 AND completed_at IS NULL AND attempt_count >= 5
          AND (lease_expires_at IS NULL OR lease_expires_at <= now()) RETURNING notification_id
      ) UPDATE notifications n SET email_status = 'FAILED'
        FROM exhausted e WHERE n.id = e.notification_id AND $1 = 'ses' AND n.email_status = 'PENDING'`, [mode]);
      const result = await pool.query<EmailJob>(`WITH eligible AS (
        SELECT d.notification_id FROM email_deliveries d JOIN notifications n ON n.id = d.notification_id
        WHERE d.mode = $2 AND d.completed_at IS NULL AND d.attempt_count < 5
          AND n.requires_email = true AND n.email_status = 'PENDING'
          AND d.next_attempt_at <= now() AND (d.lease_expires_at IS NULL OR d.lease_expires_at <= now())
        ORDER BY d.next_attempt_at, d.notification_id FOR UPDATE OF d SKIP LOCKED LIMIT 10
      ), claimed AS (
        UPDATE email_deliveries d SET owner = $1, lease_expires_at = now() + interval '60 seconds',
          attempt_count = attempt_count + 1
        FROM eligible e WHERE d.notification_id = e.notification_id AND d.mode = $2
        RETURNING d.notification_id, d.attempt_count
      ) SELECT n.id, u.email, n.event_type, n.message, c.attempt_count
        FROM claimed c JOIN notifications n ON n.id = c.notification_id JOIN users u ON u.id = n.user_id`, [owner, mode]);
      return result.rows;
    },
    async complete(id, owner) {
      const result = await pool.query(`WITH completed AS (
        UPDATE email_deliveries SET completed_at = now(), owner = NULL, lease_expires_at = NULL, last_error = NULL
        WHERE notification_id = $1 AND mode = $3 AND owner = $2 AND lease_expires_at > now()
        RETURNING notification_id
      ), sent AS (
        UPDATE notifications n SET email_status = 'SENT', email_sent_at = now()
        FROM completed c WHERE n.id = c.notification_id AND $3 = 'ses' RETURNING n.id
      ) SELECT notification_id FROM completed`, [id, owner, mode]);
      return result.rowCount === 1;
    },
    async fail(id, owner, delaySeconds, terminal = false) {
      await pool.query(`WITH failed AS (
        UPDATE email_deliveries SET owner = NULL, lease_expires_at = NULL,
          attempt_count = CASE WHEN $5 THEN GREATEST(attempt_count, 5) ELSE attempt_count END,
          next_attempt_at = now() + ($3 * interval '1 second'), last_error = 'Email send failed'
        WHERE notification_id = $1 AND mode = $4 AND owner = $2 AND lease_expires_at > now()
        RETURNING notification_id, attempt_count
      ) UPDATE notifications n SET email_status = 'FAILED'
        FROM failed f WHERE n.id = f.notification_id AND $4 = 'ses' AND f.attempt_count >= 5`, [id, owner, delaySeconds, mode, terminal]);
    },
  };
}
export const previewEmailQueue = createEmailQueue('preview');
export const sesEmailQueue = createEmailQueue('ses');
