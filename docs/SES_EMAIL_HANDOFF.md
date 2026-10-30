# SES email delivery handoff

The application adapter sends queued tutor notifications through SES when explicitly enabled. Development tests use mocked SES responses; live cloud configuration and delivery verification are separate deployment steps.

## What is ready

The matching confirmation and admin decision APIs already create notifications with email_status=PENDING in their business transaction. No extra frontend send-email API is needed.

The worker now supports three modes:

- disabled (default): does not poll or send.
- preview: local HTML/JSON files; does not mark notifications SENT.
- ses: sends with the installed AWS SDK SendEmailCommand and records acceptance in the database.

Selection, approval, and rejection use the existing approved HTML/plain-text templates. The rejection reason is included and HTML-escaped. Messages use UTF-8, the configured sender, and the tutor’s stored recipient email. Unsupported events and invalid recipients fail without calling SES.

## Cloud teammate configuration

Use these environment settings in your deployment, after configuring SES:

    EMAIL_MODE=ses
    AWS_REGION=<region containing your SES setup>
    SES_FROM_EMAIL=<verified sender address>
    TUTOR_PORTAL_URL=https://<deployed-website>/tutor/profile
    DATABASE_URL=<your deployed PostgreSQL connection>

SES mode requires an explicitly configured sender and an HTTPS, non-localhost portal URL. The actual sender must be verified by SES; the application cannot verify cloud setup locally. Credentials are resolved by the SDK’s normal provider chain. Prefer the ECS task role you configure; never put access keys in source code or email them.

Configure SES identities, sandbox/production access as appropriate, IAM permission for ses:SendEmail, region, network access from ECS, and deployment. Apply reviewed migrations before enabling the worker. If the database already has data, review the matching branch’s NOT NULL variant_id migration separately; do not blindly run it against an existing deployment.

The adapter code is email-ses.transport.ts. Worker selection is email-dispatch.worker.ts. Queue persistence is email.repository.ts. No additional package installation or schema migration was needed for this adapter: email_deliveries already has a mode field and uses (notification_id, mode) as its primary key.

## Delivery state and failures

SES jobs use mode=ses; preview uses mode=preview. A completed preview does not block a later real send.

- PENDING: eligible for the worker or waiting for a retry.
- SENT and email_sent_at: set atomically with completion only after SES returns a nonempty MessageId and the worker still owns the unexpired claim. This means accepted by SES, not guaranteed arrival in the inbox.
- FAILED: permanent SES failure or five exhausted claims. The bell notification remains available regardless of email failure.

Examples of permanent failures: rejected message, unverified sender domain, invalid parameters, and permission/configuration errors. Temporary/network/timeout/throttling failures use bounded retries: five total attempts with 30 seconds, 2 minutes, 10 minutes and 30 minutes between attempts. The SDK uses maxAttempts=1 so hidden SDK retries do not multiply the worker’s attempts. Each send gets the worker AbortSignal and a ten-second deadline.

Queue claims use short PostgreSQL statements, row locking/SKIP LOCKED, owner IDs and 60-second leases. Sends happen after the claim commits. Stale completions/failures are fenced. Exhausted abandoned claims are recorded as FAILED after expiry. Failed jobs require investigation and an explicitly reviewed requeue procedure; there is no public retry API.

Provider error messages can contain recipient addresses. Only generic error codes/state are propagated or persisted. No credentials or message bodies are logged by this adapter.

There is no exactly-once guarantee: SES may accept a message and the process may crash before recording success. Recovery can send a duplicate. SES bounce/complaint/event monitoring and a live smoke test remain cloud/deployment work.

## Verified without AWS

- Mocked SES requests verify sender, recipient, subject, HTML, text, UTF-8, portal link, rejection reason escaping, and AbortSignal forwarding.
- Missing MessageId is not counted as success.
- Throttling/timeouts retry; permanent failures become terminal.
- Dedicated local database test proves preview/SES separation, acceptance-to-SENT, retry delay, permanent/exhausted failure, expired claim recovery, and rejection of stale completion.
- Existing preview, selection, admin and notification tests were rerun. Local site remains in preview mode.

Run npm test with the explicit isolated local database settings from LOCAL_NOTIFICATIONS.md. The dedicated SES queue test additionally requires TUTORPAIR_SES_QUEUE_TESTS=1 and an empty loopback database named tutorpair_notifications_test_ses_*. It uses injected mocked SES calls, never a real provider.

Before release, your cloud teammate must perform an authorized live smoke test after AWS is configured; local mocks cannot verify IAM, SES identity verification, account quotas, sandbox restrictions, inbox delivery or the deployed website URL.
