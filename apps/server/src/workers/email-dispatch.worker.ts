/**
 * Background worker that polls PostgreSQL for pending notifications
 * and dispatches emails via Amazon SES.
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
