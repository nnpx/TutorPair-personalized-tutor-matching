# TutorPair — Notifications Architecture

> Covers how in-app notifications and automated email notifications (via Amazon SES) work. No message queues, no extra AWS services — pure Node.js.

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

1. **The request handler creates a notification row synchronously** and returns `200 OK` immediately.
2. **A background worker** (`setInterval`) running in the same Node.js process polls the database every 30 seconds for unsent emails and dispatches them via SES.

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
API returns 200 OK to student immediately (email sends async within ~30 seconds)
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

The worker is started in `server.ts` when the Express server boots. It runs inside the same process — no separate deployment, no additional infrastructure.

```
workers/email-dispatch.worker.ts

- Exported function: startEmailWorker()
- Called once in server.ts at startup
- Uses setInterval(pollAndSend, 30_000)   // Every 30 seconds
- pollAndSend():
    1. SELECT * FROM notifications
       WHERE email_status = 'PENDING' AND requires_email = true
       LIMIT 10   ← process in small batches to avoid timeouts
    2. For each notification:
       - Build email body from event_type + message
       - Call SES SendEmail API
       - On success: UPDATE email_status = 'SENT', email_sent_at = NOW()
       - On failure: UPDATE email_status = 'FAILED'
         (can be retried manually or by a future cron job)
```

**Why `LIMIT 10` per batch?**
If 500 notifications somehow accumulated (e.g., after a server restart), sending all 500 in one 30-second tick would cause the SES API calls to pile up and potentially timeout. Processing 10 at a time keeps each tick fast.

---

## Crash Resilience

This is the key advantage of the database-backed approach:

| Scenario | In-Memory Queue (Bull, etc.) | Our DB-backed Approach |
|---|---|---|
| ECS container crashes | All PENDING jobs in queue are **lost** | PENDING rows survive in PostgreSQL — picked up on next restart |
| SES is temporarily unavailable | Job may fail and be lost | Row stays `PENDING` or `FAILED` — can be retried |
| Server restarts for deployment | Queue is cleared | No impact — DB state is durable |

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
