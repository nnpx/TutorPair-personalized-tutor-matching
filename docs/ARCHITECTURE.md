# TutorPair — Architecture Decisions

> **Purpose:** Documents every major architectural decision, the options that were considered, and the rationale for the final choice. This prevents revisiting the same debates during development.

---

## 1. Repository Structure

**Decision: Monorepo with npm Workspaces**

```
tutorpair/                          ← Git repository root
├── apps/
│   ├── client/                     → Deployed to AWS Amplify Hosting (static CDN)
│   └── server/                     → Deployed to AWS ECS Fargate (Docker container)
├── packages/
│   └── shared/                     → Internal package shared by client and server
├── docs/                           ← You are here
├── package.json                    ← Workspace root (declares workspaces)
├── docker-compose.yml              ← Local dev backing services only (PostgreSQL)
└── .env.example                    ← Template for required environment variables
```

**Why:**
- `packages/shared` is the single source of truth for TypeScript enums, Zod validation schemas, and API response types. Both `apps/client` and `apps/server` import from `@tutorpair/shared`. This eliminates type drift between frontend and backend.
- Amplify and ECS deploy independently from the same repo. Amplify reads `apps/client/` only. ECS builds a Docker image from the monorepo root.
- `docker-compose.yml` runs only the PostgreSQL database locally. The React dev server (Vite) and Express API run natively on the host machine with hot-reload for speed.

**Options considered:**
- Polyrepo (two separate repos): Rejected. Cross-repo PRs for a single feature (e.g., adding a new enum) are too slow.
- Flat monorepo (`/frontend`, `/backend`): Rejected. Cannot share TypeScript types without duplicating them.

---

## 2. Backend Architecture

**Decision: Feature-First Modular with Internal Layers**

Each business domain (feature) is a self-contained folder with its own Router → Controller → Service → Repository layers inside.

```
apps/server/src/modules/
├── auth/
│   ├── auth.routes.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.repository.ts
├── matching/
│   ├── matching.routes.ts
│   ├── matching.controller.ts
│   ├── matching.service.ts
│   └── matching.repository.ts
└── ...
```

**Why:**
- Each developer is assigned one or more module folders. Working inside `modules/matching/` produces zero Git conflicts with a developer working in `modules/admin/`.
- The familiar `Router → Controller → Service → Repository` layer pattern is preserved inside each module.
- Deleting, renaming, or handing off a feature requires touching only one folder.

**Options considered:**
- Layer-First (all routes in one `/routes` folder, etc.): Rejected. Every feature addition requires touching 4 global folders simultaneously, causing frequent Git merge conflicts.
- Microservices: Rejected. Vastly over-engineered for this project scale.

---

## 3. Frontend Architecture

**Decision: Vite + React + TypeScript, Feature-based folder structure**

**State management split:**

| Concern | Library | Why |
|---|---|---|
| Server state (API data) | **TanStack Query** | Handles caching, loading, error states, and re-fetching automatically |
| Form state | **React Hook Form + Zod** | Handles complex forms (sliders, cascading dropdowns) with minimal re-renders |
| Global client state | **Zustand** | Lightweight store for auth session and user role only |

**Why TanStack Query over Redux:**
Redux requires manually writing reducers, actions, and loading booleans for every API call. TanStack Query does all of that automatically. For a REST API app like TutorPair, Redux is unnecessary overhead.

---

## 4. File Storage

**Decision: Amazon S3 Private Bucket with Presigned URLs**

- S3 bucket has **all public access blocked**.
- File uploads (tutor documents): `PUT Presigned URL` — backend generates a temporary upload URL, frontend uploads directly to S3. File binary data never passes through the Express server.
- File viewing (admin review, student viewing tutor CV): `GET Presigned URL` — backend verifies authorization, generates a short-lived (15 min) signed view URL.

**Why:**
- Uploading files through Express would put heavy memory and bandwidth pressure on ECS Fargate containers when multiple tutors upload 10MB PDFs simultaneously.
- Presigned URLs are the AWS-recommended pattern for secure, scalable file access.

---

## 5. Authentication & Authorization

**Decision: AWS Cognito (frontend) + JWT verification (backend) + PostgreSQL role sync**

- **Cognito handles:** Sign-up, sign-in, password reset, Google OAuth 2.0 token issuance.
- **Backend verifies:** The JWT token cryptographically using `aws-jwt-verify` (no network call needed).
- **PostgreSQL stores:** The user's role (`STUDENT`, `TUTOR`, `ADMIN`). Cognito does not store roles.
- **Role enforcement:** Express `requireRole` middleware checks the role from PostgreSQL on every protected route.

---

## 6. API Contract

**Decision: OpenAPI spec generated from Zod schemas using `zod-to-openapi`**

- Zod schemas defined in `packages/shared/` are the single source of truth.
- The OpenAPI spec is auto-generated from these schemas.
- This spec is the binding contract between frontend and backend developers and is used in Postman for API testing.

---

## 7. Notifications

**Decision: Database-backed async polling (no message queue)**

- When a notification event occurs (tutor selected, tutor approved/rejected), the service inserts a row into the `notifications` table with `email_status: PENDING`.
- A background worker (plain `setInterval` inside the Express process) polls every 30 seconds for `PENDING` rows and sends emails via Amazon SES.
- **No extra infrastructure**: No SQS, no Redis, no Bull. Pure Node.js running in the existing ECS container.
- **Crash-resilient**: Pending emails survive container restarts because their state is in PostgreSQL, not in memory.

---

## Technology Stack Summary

| Layer | Technology | Deployment Target |
|---|---|---|
| Frontend Framework | React 18 + Vite + TypeScript | AWS Amplify Hosting (CDN) |
| Server State | TanStack Query v5 | — |
| Forms | React Hook Form + Zod | — |
| Client State | Zustand | — |
| Backend Framework | Node.js + Express.js + TypeScript | AWS ECS Fargate |
| Database ORM | Drizzle ORM | — |
| Database | PostgreSQL 16 | Amazon RDS |
| File Storage | Amazon S3 (Private) | — |
| Authentication | AWS Cognito + Google OAuth 2.0 | — |
| Email | Amazon SES | — |
| Containerization | Docker | Amazon ECR → ECS Fargate |
| Load Balancer | AWS ALB + ACM | — |
| Secrets | AWS Secrets Manager | Production only |
| Monitoring | AWS CloudWatch | — |
| API Docs | OpenAPI via `zod-to-openapi` | — |
