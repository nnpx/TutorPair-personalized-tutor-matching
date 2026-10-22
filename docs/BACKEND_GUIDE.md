# TutorPair — Backend Developer Guide

> This guide defines every convention, rule, and pattern that backend developers must follow. Read this before writing a single line of backend code.

---

## 1. Module Anatomy

Every feature module follows the exact same 4-file structure. No exceptions.

```
modules/{feature}/
├── {feature}.routes.ts       # 1. HTTP route definitions + middleware chain
├── {feature}.controller.ts   # 2. Request/response handling only
├── {feature}.service.ts      # 3. Business logic only
└── {feature}.repository.ts   # 4. Database queries only (Drizzle ORM)
```

### Layer Responsibilities

| File | Responsibility | What It Must NOT Do |
|---|---|---|
| `routes.ts` | Define endpoint paths, HTTP verbs, apply middleware (auth, role guard, validation) | Contain business logic or DB queries |
| `controller.ts` | Extract `req.body`, `req.params`, call service, return `res.json()` | Contain SQL, business rules, or call another controller |
| `service.ts` | Business rules, calculations, orchestration | Call `req`/`res` objects or write raw SQL |
| `repository.ts` | All Drizzle ORM queries — SELECT, INSERT, UPDATE, DELETE | Contain business logic or call other repositories in a chain |

### Concrete Example — Matching Module

```typescript
// matching.routes.ts
router.post('/', authenticate, requireRole(['STUDENT']), validateRequest(MatchRequestSchema), matchingController.runMatch);

// matching.controller.ts (wrapped with asyncHandler)
export const runMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchingService.findTop3(req.user!.id, req.body);
  res.json(successResponse(result));
});

// matching.service.ts
async findTop3(studentId: string, preferences: MatchRequestDto) {
  const eligibleTutors = await matchingRepository.getEligibleTutors(preferences); // own repo
  const tutorSubjects = await tutorRepository.getSubjectsForTutors(ids);          // cross-module repo import ✅
  return this.scoreAndRank(eligibleTutors, tutorSubjects, preferences);
}

// matching.repository.ts
async getEligibleTutors(filters: HardFilters) {
  return db.select().from(tutors).where(...hardFilterConditions);
}
```

---

## 2. Cross-Module Dependency Rule

This is the most important rule for avoiding circular import crashes.

### ✅ Allowed
```
moduleA.service.ts  →  moduleA.repository.ts    (own module — always fine)
moduleA.service.ts  →  moduleB.repository.ts    (other module's repository — allowed)
moduleA.service.ts  →  common/utils/*.ts        (shared utilities — always fine)
moduleA.service.ts  →  common/notifications/    (shared notification service — allowed)
```

### ❌ Not Allowed
```
moduleA.service.ts  →  moduleB.service.ts       (service-to-service — FORBIDDEN, causes circular deps)
moduleA.routes.ts   →  moduleB.controller.ts    (FORBIDDEN)
```

### Why this rule exists
If `matching.service` imports `tutor.service`, and later someone adds a call in `tutor.service` back to `matching.service`, Node.js gets a circular module reference and throws a cryptic startup error. Importing only repositories is a safe boundary because repositories have no outbound imports to other modules.

### The `notifications` exception
`notifications` is used by `admin`, `matching`, and `reviews`. It lives in `common/notifications/` instead of `modules/`. Any service can import it freely.

```typescript
// admin.service.ts
import { notificationService } from '../../common/notifications/notification.service';

await notificationService.createNotification({
  userId: tutor.userId,
  eventType: NotificationEventType.VERIFICATION_APPROVED,
  requiresEmail: true,
});
```

---

## 3. Standard API Response Format

All endpoints must return responses using the shared response formatter. This ensures the frontend always receives a consistent shape.

```typescript
// common/utils/response.util.ts exports:
successResponse(data, message?)   // { success: true, data, message }
errorResponse(message, details?)  // { success: false, message, details }
```

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Tutor profile updated successfully"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "budget_max", "issue": "Must be a positive number" }]
}
```

---

## 4. Middleware Stack (Applied in Order)

Every protected route applies this chain in order:

```typescript
router.post('/api/matching',
  authenticate,             // 1. Verify Cognito JWT, attach req.user
  requireRole(['STUDENT']), // 2. Check role from PostgreSQL
  validateRequest(Schema),  // 3. Validate req.body with Zod schema from @tutorpair/shared
  controller.method         // 4. Handle request
);
```

### `authenticate` middleware (`common/middlewares/authenticate-jwt.ts`)
- Reads `Authorization: Bearer <token>` header.
- Verifies token signature using `aws-jwt-verify` with your Cognito User Pool ID and Client ID.
- Extracts `sub` (Cognito user ID) and `email`.
- Looks up the `users` table in PostgreSQL using `cognito_sub`.
- Attaches the full user record to `req.user`.
- Throws `UnauthorizedError` if token is missing, expired, or invalid.

### `requireRole` middleware (`common/middlewares/require-role.ts`)
- Accepts an array of allowed roles: `requireRole(['ADMIN'])` or `requireRole(['STUDENT', 'TUTOR'])`.
- Reads `req.user.role` (already set by `authenticate`).
- Throws `ForbiddenError` if the role is not in the allowed list.
- **This is the real security gate. Frontend route guards are UX only.**

### `validateRequest` middleware (`common/middlewares/validate-request.ts`)
- Accepts a Zod schema from `@tutorpair/shared`.
- Validates `req.body` (or `req.query`/`req.params` if specified).
- If validation fails, throws `BadRequestError` with field-level error details.

---

## 5. Error Handling & Async Handler

### The Single-Way Error Rule
Never `throw` raw `Error` objects or hardcode status numbers. Always throw typed, semantic errors from `common/errors/http-errors.ts`:

```typescript
// ✅ Correct (one standard way across the entire project)
throw new NotFoundError('Tutor not found');
throw new ForbiddenError('Only admins can approve documents');
throw new BadRequestError('File size exceeds 10MB limit', validationErrors);
throw new ConflictError('User with this email already exists');

// ❌ Wrong
throw new Error('Something went wrong');
res.status(404).json({ message: 'Not found' }); // Never write this
```

> **Rule:** If a developer needs an HTTP error that isn't already defined in `http-errors.ts`, they must add it to `common/errors/http-errors.ts` first, then use it.

### Using `asyncHandler` in Controllers
Controllers should be wrapped with `asyncHandler` from `common/utils/async-handler.ts`. This catches any promise rejections and forwards them to the global error handler automatically—eliminating repetitive `try/catch` boilerplate:

```typescript
// ✅ Clean controller with asyncHandler
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await studentsService.getProfile(req.user!.id);
  res.status(200).json(successResponse(profile));
});
```

---

## 6. Environment Variables

### Local Development
1. Copy `.env.example` to `.env.local` in `apps/server/`.
2. Fill in your local values (ask team lead for Cognito and AWS dev credentials).
3. **Never commit `.env.local`** — it is in `.gitignore`.

### Production (ECS Fargate)
- Secrets are injected from **AWS Secrets Manager** via ECS Task Definition.
- The Docker image contains **zero secrets**.

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AWS_REGION` | e.g., `ap-southeast-1` |
| `COGNITO_USER_POOL_ID` | From Cognito console |
| `COGNITO_CLIENT_ID` | From Cognito console |
| `S3_BUCKET_NAME` | Private S3 bucket name |
| `SES_FROM_EMAIL` | Verified sender email in SES |
| `ALLOWED_ORIGIN` | Frontend URL (`http://localhost:5173` locally) |
| `NODE_ENV` | `development` or `production` |

### Env Validation on Startup

`config/env.ts` exports a Zod-validated `env` object. If any required variable is missing, the server **crashes immediately on startup** with a clear error message listing which variables are missing. This prevents silent misconfiguration in production.

```typescript
// Usage in any file:
import { env } from '../config/env';
const bucketName = env.S3_BUCKET_NAME; // Fully typed, guaranteed to exist
```

---

## 7. Registering a New Module

When you create a new module, register its router in `app.ts`:

```typescript
// app.ts
import { matchingRouter } from './modules/matching/matching.routes';
app.use('/api/matching', matchingRouter);
```

That single line is the only file outside your module folder you need to touch.

---

## 8. CORS Configuration

CORS is configured in `app.ts` with the `cors` package:

```typescript
app.use(cors({
  origin: env.ALLOWED_ORIGIN,     // Set via environment variable
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

- **Local dev**: `ALLOWED_ORIGIN=http://localhost:5173`
- **Production**: `ALLOWED_ORIGIN=https://<your-amplify-domain>` (to be updated when domain is finalized)

---

## 9. Testing & Developer Verification Guide

The accepted [availability decision](./clouds/HIGH_AVAILABILITY.md) applies to all backend modules: the same code must work with one or multiple API instances. Implement database-backed concurrency protection and repeat-safe writes, atomic business/notification transactions, bounded connection recovery, stateless request handling, separate liveness/readiness, and graceful HTTP/worker/pool shutdown. These are implementation requirements, not completed features. Keep local mock authentication functional and reject mock tokens in production.

Integration coverage must include one and two API processes sharing PostgreSQL, concurrent tutor confirmation/review requests, worker claims and crash recovery, transient database loss, and SIGTERM. Cloud failure exercises are separate from `npm test`; see the availability guide for evidence requirements. Migrations run once per release rather than from every task at startup, and must support overlapping application versions.

> ⚠️ **MANDATORY FOR ALL DEVELOPERS & AI AGENTS**:  
> Never commit or push code generated by AI without automated testing and manual visual verification. Blindly trusting AI output without testing leads to broken builds and silent database bugs.

### 9.1. What Kind of Tests Are Required?

#### 1. Unit Tests (Pure Functions & Business Calculations)
* **What to test**:
  - **Matchmaking & Scoring Formulas**: `scoring.util.ts` (1–5 slider distance calculations, budget proximity scoring, availability intersection logic).
  - **Validation Schemas**: Zod request schemas in `packages/shared/src/schemas/` to ensure malformed inputs are rejected.
  - **Formatting & Helper Utilities**: Date parsing, presigned URL helpers, string santization.
* **Standard**: Unit tests should be fast, isolated, and require no live network connections.
* **Run command**:
  ```bash
  npm test
  ```

#### 2. Integration / API Tests (HTTP Endpoints & Database)
* **What to test**:
  - **Role-Based Access Control**: Verify that `STUDENT` receives `403 Forbidden` when attempting to access `/api/admin/*`, and unauthenticated requests return `401 Unauthorized`.
  - **Endpoint Contracts**: Validate that `POST /api/matching` returns the expected Top 3 recommendation shape.
  - **Semantic Errors**: Verify that invalid IDs return `404 NotFoundError` and malformed payloads return `400 BadRequestError` with formatted validation messages.
  - **Local Mock Auth**: Verify endpoints work with `Authorization: Bearer mock-token-<user-id>`.

---

### 9.2. Mandatory Database Verification with Drizzle Studio

Whenever your task touches the database (schema definitions, migrations, seed data, or complex repository queries), you **MUST** visually verify the changes in **Drizzle Studio**:

1. Run the local studio:
   ```bash
   npm run db:studio
   ```
2. Open **[https://local.drizzle.studio](https://local.drizzle.studio)** in your browser.
3. Check:
   - Did your new column or table get created with the correct data type?
   - Are foreign key relations and cascade rules working properly?
   - Does `npm run db:seed` or your API route successfully insert the expected rows?

---

### 9.3. Developer & AI Agent Pre-Commit Checklist

Before marking any task as complete or committing to Git, complete this verification checklist:

- [ ] **Type Check**: `npm run build` passes with zero TypeScript errors across all workspaces (`shared`, `server`, `client`).
- [ ] **Unit Tests**: Business logic & math formulas are covered by tests (`npm test`).
- [ ] **Database Verified**: If schemas or queries changed, visually inspected via `npm run db:studio`.
- [ ] **API Endpoint Verified**: Endpoint tested with Postman, curl, or automated integration test.
- [ ] **AI Output Communicated**: AI agents must explicitly tell the human developer how to run and verify their changes.

