# TutorPair — Notifications Architecture

> Covers how in-app notifications and automated email notifications (via Amazon SES) work. No message queues, no extra AWS services — pure Node.js.

The accepted [availability decision](./clouds/HIGH_AVAILABILITY.md) requires the same worker design to work with one or multiple API instances. The requirements below are an implementation target; the current worker is still a TODO scaffold. A process-local timer alone does not coordinate workers across tasks.

---

## Two Types of Notifications

| Type | How It Works | Where It Shows |
|---|---|---|
| **In-app notification** | A row in the `notifications` table with `is_read = false` | Bell icon / badge in the frontend navbar |
| **Email notification** | The same row has `requires_email = true` and `email_status = PENDING` → sent by background worker via SES | User's email inbox |

Both types share the same `notifications` table row. Every notification event creates one row.

---

## Notification Events Reference

| `NotificationEventType` | Triggered By | Target User | Email? |
|---|---|---|---|
| `TUTOR_SELECTED` | Student confirms a tutor from Top 3 | The selected Tutor | Yes |
| `VERIFICATION_APPROVED` | Admin approves a tutor application | The Tutor | Yes |
| `VERIFICATION_REJECTED` | Admin rejects a tutor application | The Tutor | Yes |
| `NEW_REVIEW` | Student submits a review | The reviewed Tutor | No (in-app only) |

---

## Architecture: Database-Backed Async Polling

The system uses no message queue. Instead:

1. **The request handler persists the notification with the business change in one transaction** and returns after commit, without waiting for SES. Repeated requests must not create duplicate business events or notification rows.
2. **A background worker in each API process** polls every 30 seconds, atomically claims eligible work in PostgreSQL, and dispatches via SES. It must prevent overlapping polls locally and use durable, expiring ownership across processes.

The following diagram shows service relationships within one task. Its simplified query/send labels do not replace the claim protocol defined under Background Worker Implementation; multiple tasks share the same PostgreSQL state.

```
┌────────────────────────────────────────────────────────────────────┐
│                  ECS Fargate Container (Single Node.js Process)    │
│                                                                    │
│   ┌──────────────────────────┐    ┌────────────────────────────┐  │
│   │     Express HTTP API      │    │  Email Dispatch Worker      │  │
│   │                          │    │  (setInterval, 30 seconds)  │  │
│   │  Any route that triggers  │    │                            │  │
│   │  a notification calls:   │    │  1. Query DB:              │  │
│   │                          │    │     WHERE email_status =   │  │
│   │  notificationService     │    │     'PENDING' AND          │  │
│   │    .createNotification() │    │     requires_email = true  │  │
│   │                          │    │                            │  │
│   │  → INSERT INTO           │    │  2. For each row:          │  │
│   │    notifications         │    │     → Send via AWS SES     │  │
│   │    { ...,                │    │                            │  │
│   │      email_status:       │    │  3. UPDATE row:            │  │
│   │      'PENDING' }         │    │     email_status = 'SENT'  │  │
│   │                          │    │     or 'FAILED'            │  │
│   │  → Returns 200 OK        │    │     email_sent_at = NOW()  │  │
│   │    instantly ✓           │    │                            │  │
│   └──────────────────────────┘    └────────────────────────────┘  │
│                        ↕ (both read/write)  ↕                     │
│                       PostgreSQL (RDS)                             │
└────────────────────────────────────────────────────────────────────┘
```

---

## Flow: Tutor Selected Notification

```
Student clicks "Confirm Tutor" button
    │
    ▼
POST /api/matching/{matchRequestId}/confirm
    │
    ▼
matching.service.confirmSelection(matchRequestId, tutorId)
    │  - UPDATE match_requests SET status = 'CONFIRMED'
    │  - UPDATE match_recommendations SET is_selected = true WHERE tutor_id = tutorId
    │  - Find the tutor's user_id
    │
    ▼
notificationService.createNotification({
  userId: tutor.userId,
  eventType: 'TUTOR_SELECTED',
  message: 'A student has selected you as their tutor. Please check your contact details.',
  requiresEmail: true,          ← triggers SES dispatch via background worker
})
    │
    ▼
INSERT INTO notifications (user_id, event_type, message, is_read, requires_email, email_status)
VALUES (..., 'TUTOR_SELECTED', '...', false, true, 'PENDING')
    │
    ▼
API returns after transaction commit (email is asynchronous; backlog and retries affect delay)
```

---

## Flow: In-App Notification Badge (Frontend Polling)

The frontend checks for unread notifications on page load and periodically:

```typescript
// features/auth/hooks/useNotifications.ts
const { data } = useQuery({
  queryKey: ['notifications', 'unread'],
  queryFn: () => apiClient.get('/api/notifications?unread=true').then(r => r.data),
  refetchInterval: 60_000,   // Poll every 60 seconds
});

// unreadCount displayed as badge on Navbar bell icon
```

**Mark as read:**
```typescript
// When user opens the notifications panel
useMutation({
  mutationFn: (notificationId: string) =>
    apiClient.patch(`/api/notifications/${notificationId}/read`),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
});
```

---

## Background Worker Implementation

The worker is started in `server.ts` when the Express server boots. It runs inside each API process, including when only one task is deployed. No separate worker deployment or queue service is required.

```
workers/email-dispatch.worker.ts

- Exported function: startEmailWorker()
- Called once in server.ts at startup
- Polls every 30 seconds; skips an overlapping tick while a poll is active
- pollAndSend():
    1. Atomically claim up to 10 eligible notifications in a short transaction
       Persist owner and expiry; recover abandoned claims after expiry
       Commit before network calls; do not hold row locks during SES requests
    2. For each notification owned by this attempt:
       - Build email body from event_type + message
       - Keep ownership valid while sending; bound SES timeouts
       - Call SES SendEmail API outside the claim transaction
       - On success: record SENT and sent time only if ownership is still valid
       - On transient failure: schedule bounded retry with backoff
       - On permanent/exhausted failure: record failure for investigation
    3. On shutdown: stop new polls/claims and drain bounded in-flight work
```

The lease fields, retry metadata, event uniqueness, and status transitions must be specified during implementation. They are not assumed to exist in the current schema. If enums or DTOs change, update `packages/shared` first and run `npm run build:shared`; deliver database changes through reviewed migrations.

**Why `LIMIT 10` per batch?**
If 500 notifications somehow accumulated (e.g., after a server restart), sending all 500 in one 30-second tick would cause the SES API calls to pile up and potentially timeout. Processing 10 at a time keeps each tick fast.

---

## Crash Resilience

Durable notification records enable recovery, but recovery and duplicate prevention must be implemented explicitly:

| Scenario | Required behavior |
|---|---|
| Container crashes before sending | Notification persists and abandoned claim expires for retry |
| SES is temporarily unavailable | Retry with bounded backoff; preserve business transaction success |
| Two workers or overlapping deployments | Only one valid owner may process a notification; stale completions are rejected |
| SES accepts email but worker crashes before recording success | Outcome is ambiguous; recovery can deliver a duplicate. Do not promise exactly-once delivery |
| Only one API process is running | That worker can claim, send, retry, and recover work without a second instance |

Use database-level event identity to avoid duplicate notification creation. It does not eliminate the external SES send/commit ambiguity. Verify single-worker, concurrent-worker, crash-recovery, and shutdown cases described in [HIGH_AVAILABILITY.md](./clouds/HIGH_AVAILABILITY.md).

---

## Notification Service API

Used by `matching.service.ts`, `admin.service.ts`, and `reviews.service.ts`:

```typescript
// common/notifications/notification.service.ts
notificationService.createNotification({
  userId: string,                    // Target user's ID (from users table)
  eventType: NotificationEventType,  // From @tutorpair/shared enum
  message: string,                   // Human-readable message text
  requiresEmail: boolean,            // true = SES email will be dispatched
})
```

This is the **only** function other modules need to call. The worker handles the rest.
