/**
 * ============================================================================
 * Module 8: Notifications Background Email Worker (TP-12)
 * Assigned To: Shakhzodakhon
 * Spec Reference: docs/NOTIFICATIONS.md
 * ============================================================================
 *
 * This worker runs inside the Node.js API process and polls PostgreSQL every 30s
 * for notifications with email_status = 'PENDING' and requires_email = true.
 *
 * Upstream Integration Triggers Already Wired:
 * - TP-13: TUTOR_SELECTED queued in matching.service.ts (confirmSelection)
 * - TP-14: VERIFICATION_APPROVED / VERIFICATION_REJECTED queued in admin.service.ts
 *
 * Hand-off Implementation Steps for Shakhzodakhon:
 * 1. Query notificationRepository.getPendingEmails(10)
 * 2. Build email template based on event_type (TUTOR_SELECTED, VERIFICATION_APPROVED/REJECTED)
 * 3. Send email using SESClient (@aws-sdk/client-ses)
 * 4. Update notification row via notificationRepository.updateEmailStatus(id, 'SENT' | 'FAILED')
 */
export function startEmailWorker(): void {
  const INTERVAL_MS = 30_000; // 30 seconds

  console.log('📧 Email dispatch worker initialized (interval: 30s)');

  setInterval(async () => {
    try {
      // TODO: Query notifications table for email_status = 'PENDING' and dispatch via SESClient
    } catch (error) {
      console.error('Email dispatch worker error:', error);
    }
  }, INTERVAL_MS);
}
