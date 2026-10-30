# Tutor notifications: local setup and verification

Tutor confirmations and admin application decisions persist in-app notifications and queue emails in the same database transaction. The tutor bell lists owned notifications, shows an unread count, and supports per-item/all-read actions. Worker delivery is separate from the request path.

## Local configuration

EMAIL_MODE is disabled by default. Use preview for local HTML/JSON email files; it never contacts AWS or marks an email SENT. Keep previews in a private local directory, not a static/public web folder. The default work/email-preview directory is ignored by Git and is relative to the server working directory.

    EMAIL_MODE=preview
    EMAIL_PREVIEW_DIR=work/email-preview
    TUTOR_PORTAL_URL=http://localhost:5180/tutor/profile

Preview mode requires a loopback database host and NODE_ENV=development or test. SES delivery is configured separately in SES_EMAIL_HANDOFF.md.

Use an isolated local PostgreSQL database for write tests. The notification migration adds email_deliveries; it does not reset or seed existing data. The upstream matching migration adds NOT NULL match_requests.variant_id, which needs separate review if an existing deployment already contains match requests.

## API and UI integration

- GET /api/notifications: owned notifications, newest first, and unreadCount.
- PATCH /api/notifications/:id/read: owned notification only; malformed UUID -> 400, missing/other user's notification -> 404.
- PATCH /api/notifications/read-all: current tutor only.

All routes require authenticated TUTOR role. The response excludes recipient IDs and email-delivery internals. The bell polls every 60 seconds while visible and refreshes on focus/open. Read status is independent of email status. The clearly labeled development-only sample does not touch the database.

The student form saves the chosen budget/availability, calls POST /api/matching, then presents server-provided recommendations. Confirmation calls POST /api/matching/:matchRequestId/confirm with recommendation_id and tutor_id. The matching backend algorithm and API contract are unchanged. Budget/availability updates are separate requests; an earlier update can persist if a later request fails. Results currently use browser navigation state; persisted match history is outside this change.

Admin decisions lock the tutor and save status and notification atomically. Repeating the same status does not create a duplicate. Notification persistence failure rolls back the status update; an in-memory fallback is deliberately not treated as a verified decision.

The /unauthorized page explains when an email portal link is opened with the wrong account. Tutor Portal links require a tutor session in the same browser.

## Tests

From the repository root, run npm run build and npm test with DATABASE_URL explicitly targeting the isolated database. Tests write/delete fixture data; never point them at a shared or production database.

Example using a dedicated local database after migration:

    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tutorpair_notifications_test_20261030 NODE_ENV=test EMAIL_MODE=disabled npm test

The full runner discovers all .test.ts files recursively. The notification-focused command is npm run test:notifications. Database-specific notification tests are opt-in and assert a loopback host and the isolated database name prefix:

    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tutorpair_notifications_test_20261030 NODE_ENV=test EMAIL_MODE=disabled TUTORPAIR_ISOLATED_TESTS=1 node --import tsx --test --test-force-exit apps/server/src/common/notifications/notification.local.integration.test.ts

Run these scenarios separately from other suites/active preview workers using the same fixture jobs. They cover real HTTP APIs and PostgreSQL: confirmation duplicates, ownership, persisted read state, admin decisions/reasons, transaction rollback, claim concurrency, expired/stale leases and preview files.

For SES queue tests, use an empty, separate loopback database named tutorpair_notifications_test_ses_* and set TUTORPAIR_SES_QUEUE_TESTS=1. These inject mocked SES calls; they never send real email.

## Human database verification

After reviewing/applying migrations to the isolated database, run npm run db:studio with that target explicitly selected:

    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tutorpair_notifications_test_20261030 npm run db:studio --workspace=server -- --host 127.0.0.1 --port 4984

Open https://local.drizzle.studio?port=4984 (https://local.drizzle.studio with the default port). Inspect match_requests, match_recommendations, notifications and email_deliveries: one selected recommendation/notification, correct recipient, foreign-key relationships, separate preview/SES mode and completion/read status. Use only synthetic local fixtures.

## Limits

Notification history currently returns all owned rows; cursor pagination is a follow-up for larger histories. Dashboard matched-student cards and persisted match history remain outside this notification work. SES acceptance is not guaranteed inbox arrival, and exactly-once delivery is not promised. Cloud identity/permissions, deployment, monitoring and a live delivery smoke test remain required; see SES_EMAIL_HANDOFF.md.
