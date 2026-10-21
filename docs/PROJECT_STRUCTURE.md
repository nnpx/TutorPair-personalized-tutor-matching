# TutorPair — Full Project Structure

> Complete annotated directory tree for the entire monorepo. Use this as the reference when creating new files to ensure they go in the correct location.

---

## Root Level

```
tutorpair/
├── apps/
│   ├── client/          # React frontend (→ AWS Amplify)
│   └── server/          # Express backend (→ AWS ECS Fargate via Docker)
├── packages/
│   └── shared/          # Shared TypeScript package (@tutorpair/shared)
├── docs/                # Architecture and convention documentation (you are here)
├── .env.example         # Template listing all required environment variables
├── .gitignore           # Ignore node_modules, .env.local, dist, etc.
├── docker-compose.yml   # Local PostgreSQL only (NOT for running the app itself)
├── Dockerfile           # Monorepo-aware Dockerfile for the backend (at repo root)
└── package.json         # npm workspace root
```

---

## `packages/shared/` — Shared Package

```
packages/shared/
├── src/
│   ├── enums/
│   │   ├── user-role.enum.ts           # UserRole: STUDENT | TUTOR | ADMIN
│   │   ├── verification-status.enum.ts # VerificationStatus: PENDING | APPROVED | REJECTED
│   │   ├── tutor-type.enum.ts          # TutorType, TutorTypePref
│   │   ├── subject-category.enum.ts    # SubjectCategory: GENERAL_LEARNING | LANGUAGE_TESTING | UNIVERSITY_ENTRANCE
│   │   ├── learning-goal.enum.ts       # LearningGoal enum (used for UI grouping in Step 3)
│   │   ├── document-type.enum.ts       # DocumentType: CV | ACADEMIC_TRANSCRIPT | etc.
│   │   ├── day-of-week.enum.ts         # DayOfWeek: MONDAY → SUNDAY
│   │   ├── notification-event.enum.ts  # NotificationEventType: TUTOR_SELECTED | VERIFICATION_APPROVED | etc.
│   │   └── email-status.enum.ts        # EmailStatus: NONE | PENDING | SENT | FAILED
│   ├── schemas/                        # Zod schemas (shared validation logic)
│   │   ├── student.schema.ts           # CreateStudentProfileSchema, UpdateStudentProfileSchema
│   │   ├── tutor.schema.ts             # CreateTutorProfileSchema, UpdateTutorProfileSchema
│   │   ├── matching.schema.ts          # MatchRequestSchema, MatchResultSchema
│   │   ├── review.schema.ts            # CreateReviewSchema
│   │   ├── document.schema.ts          # PresignedUploadRequestSchema, ConfirmUploadSchema
│   │   └── auth.schema.ts              # SyncUserSchema
│   ├── types/                          # TypeScript types derived from Zod schemas (for DRY typing)
│   │   └── index.ts
│   └── index.ts                        # Public barrel export for the package
├── package.json                        # { "name": "@tutorpair/shared" }
└── tsconfig.json
```

**Rules for `packages/shared/`:**
- If an enum, type, or validation schema is needed by both `apps/client` and `apps/server`, it must live here.
- Never import from `apps/client` or `apps/server` inside this package.
- All exports go through `src/index.ts`.

---

## `apps/server/` — Express Backend

```
apps/server/
├── src/
│   ├── modules/                        # Feature modules (the core of the backend)
│   │   ├── auth/
│   │   │   ├── auth.routes.ts          # POST /api/auth/sync
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts         # First-login user creation logic
│   │   │   └── auth.repository.ts      # findByCogintoSub, createUser
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts         # GET /api/users/me
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.repository.ts
│   │   │
│   │   ├── students/
│   │   │   ├── students.routes.ts      # GET/PUT /api/students/me/profile
│   │   │   ├── students.controller.ts
│   │   │   ├── students.service.ts
│   │   │   └── students.repository.ts
│   │   │
│   │   ├── tutors/
│   │   │   ├── tutors.routes.ts        # GET/PUT /api/tutors/me/profile, GET /api/tutors/:id
│   │   │   ├── tutors.controller.ts
│   │   │   ├── tutors.service.ts
│   │   │   └── tutors.repository.ts
│   │   │
│   │   ├── subjects/
│   │   │   ├── subjects.routes.ts      # GET /api/subjects (for cascading dropdown)
│   │   │   ├── subjects.controller.ts
│   │   │   ├── subjects.service.ts
│   │   │   └── subjects.repository.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── documents.routes.ts     # POST /api/documents/presigned-upload, POST /api/documents/confirm
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts    # Presigned URL generation, size quota validation
│   │   │   └── documents.repository.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.ts         # GET /api/admin/tutors, PATCH /api/admin/tutors/:id/verify
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts        # Approve/reject logic, triggers notifications
│   │   │   └── admin.repository.ts
│   │   │
│   │   ├── matching/
│   │   │   ├── matching.routes.ts      # POST /api/matching, GET /api/matching/history
│   │   │   ├── matching.controller.ts
│   │   │   ├── matching.service.ts     # Hard filters + weighted scoring algorithm
│   │   │   └── matching.repository.ts  # Queries tutors, subjects, availability for matching
│   │   │
│   │   └── reviews/
│   │       ├── reviews.routes.ts       # POST /api/reviews, GET /api/reviews/tutor/:id
│   │       ├── reviews.controller.ts
│   │       ├── reviews.service.ts      # Validates eligibility, updates tutor avg rating
│   │       └── reviews.repository.ts
│   │
│   ├── common/                         # Shared backend utilities (NOT feature-specific)
│   │   ├── middlewares/
│   │   │   ├── authenticate-jwt.ts     # Verifies Cognito JWT, attaches user to req
│   │   │   ├── require-role.ts         # requireRole(['ADMIN']) — RBAC enforcement
│   │   │   └── validate-request.ts     # Zod body/query/param validation middleware
│   │   ├── errors/
│   │   │   ├── app-error.ts            # Base AppError class with statusCode
│   │   │   ├── http-errors.ts          # NotFoundError, ForbiddenError, UnauthorizedError, BadRequestError
│   │   │   └── error-handler.ts        # Global Express error handler middleware
│   │   ├── notifications/              # Shared notification utility (called by multiple modules)
│   │   │   ├── notification.service.ts # createNotification(), used by admin, matching, reviews
│   │   │   └── notification.repository.ts
│   │   └── utils/
│   │       ├── response.util.ts        # Standardized API response formatter { success, data, message }
│   │       ├── scoring.util.ts         # Slider distance scoring math for matching algorithm
│   │       └── s3.util.ts              # AWS S3 presigned URL generation helpers
│   │
│   ├── db/
│   │   ├── schema/                     # Drizzle ORM table definitions
│   │   │   ├── users.schema.ts
│   │   │   ├── students.schema.ts
│   │   │   ├── tutors.schema.ts
│   │   │   ├── subjects.schema.ts
│   │   │   ├── availability.schema.ts
│   │   │   ├── documents.schema.ts
│   │   │   ├── matching.schema.ts
│   │   │   ├── reviews.schema.ts
│   │   │   ├── notifications.schema.ts
│   │   │   └── index.ts               # Barrel export of all schemas
│   │   ├── migrations/                 # SQL migration files generated by drizzle-kit
│   │   │   └── 0001_initial_schema.sql
│   │   └── client.ts                   # Drizzle client instance (exports `db`)
│   │
│   ├── config/
│   │   ├── env.ts                      # Zod env schema — validates all env vars on startup
│   │   └── aws-clients.ts              # Initializes S3Client, SESClient, CognitoJwtVerifier
│   │
│   ├── workers/
│   │   └── email-dispatch.worker.ts    # setInterval background job — polls PENDING notifications, sends via SES
│   │
│   └── app.ts                          # Express app setup: CORS, JSON parser, routes, error handler
│   └── server.ts                       # Entry point: starts HTTP server + email worker
│
├── package.json                        # { "name": "server" }
├── tsconfig.json
└── .env.local                          # Local secrets (GITIGNORED — never commit this)
```

---

## `apps/client/` — React Frontend

```
apps/client/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/                     # Reusable, generic UI components (no business logic)
│   │   ├── ui/                         # Primitives: Button, Input, Modal, Card, Badge, Spinner
│   │   ├── forms/                      # SliderInput, CascadeSubjectDropdown, FileUploadField, StarRating
│   │   └── layout/                     # Navbar, Sidebar, PageWrapper
│   │
│   ├── features/                       # Feature slices (mirrors backend modules)
│   │   ├── auth/
│   │   │   ├── components/             # LoginForm, RegisterForm, GoogleOAuthButton
│   │   │   ├── hooks/                  # useAuth, useCurrentUser
│   │   │   └── auth.api.ts             # API calls: syncUser, getCurrentUser
│   │   ├── students/
│   │   │   ├── components/             # StudentProfileForm, PreferenceSliders
│   │   │   ├── hooks/                  # useStudentProfile
│   │   │   └── students.api.ts
│   │   ├── tutors/
│   │   │   ├── components/             # TutorProfileForm, DocumentUploadSection, TutorCard
│   │   │   ├── hooks/                  # useTutorProfile
│   │   │   └── tutors.api.ts
│   │   ├── matching/
│   │   │   ├── components/             # SubjectCascadeFlow, StyleSliders, Top3Results, MatchCard
│   │   │   ├── hooks/                  # useMatchRequest, useMatchHistory
│   │   │   └── matching.api.ts
│   │   ├── admin/
│   │   │   ├── components/             # TutorVerificationTable, DocumentViewerModal, ApproveRejectForm
│   │   │   ├── hooks/                  # useAdminTutorQueue
│   │   │   └── admin.api.ts
│   │   └── reviews/
│   │       ├── components/             # ReviewForm, ReviewList, StarDisplay
│   │       ├── hooks/                  # useReviews
│   │       └── reviews.api.ts
│   │
│   ├── layouts/
│   │   ├── StudentLayout.tsx           # Navbar with student-specific nav links
│   │   ├── TutorLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── AuthLayout.tsx              # Centered card layout for login/register pages
│   │
│   ├── routes/
│   │   ├── index.tsx                   # React Router root with all route definitions
│   │   └── ProtectedRoute.tsx          # Role-based route guard component
│   │
│   ├── services/
│   │   └── api-client.ts               # Axios instance — auto-attaches Cognito Bearer token
│   │
│   ├── store/
│   │   └── auth.store.ts               # Zustand store — holds currentUser and role
│   │
│   ├── hooks/                          # App-wide custom hooks (not feature-specific)
│   │   └── useNotifications.ts
│   │
│   └── main.tsx                        # App entry point, Amplify.configure(), QueryClientProvider
│
├── index.html
├── vite.config.ts
├── package.json                        # { "name": "client" }
└── tsconfig.json
```
