# TutorPair — Cloud-Based Tutor Matching Platform

> A cloud-native platform connecting G1–G12 students with verified private tutors in Thailand through structured profiles, admin verification, and a rule-based weighted matchmaking system.

---

## 📖 Project Context & Overview

In Thailand, primary and secondary students (Grades 1–12) face significant hurdles when finding private tutors: tutor details are scattered across informal social media groups, qualifications and test certificates (IELTS, SAT, TGAT) are difficult to verify, and comparing tutors across schedule, budget, learning pace, and personality is tedious and error-prone.

**TutorPair** solves this with a cloud-native platform featuring:
* **Role-Based Profiles**: Tailored experiences for **Students**, **Tutors**, and **Administrators** with AWS Cognito JWT authentication and seamless role synchronization.
* **3-Step Cascading Subject Taxonomy**: Complete G1–G12 taxonomy across `GENERAL_LEARNING` (school curriculum), `LANGUAGE_TESTING` (standardized exams like IELTS, HSK, JLPT), and `UNIVERSITY_ENTRANCE` (TGAT/TPAT, A-Level).
* **Admin Document Verification**: Tutors submit degree transcripts, CVs, and score certificates via direct S3 presigned URLs for admin review before appearing in search pools.
* **Two-Stage Matchmaking**:
  1. *Hard Filters*: Strictly eliminates tutors who don't match grade level, subject variant, and schedule availability.
  2. *Weighted Compatibility Scoring*: Ranks tutors using 1–5 slider responses for learning/teaching styles (5 dimensions), personality traits (4 dimensions), and budget fit.
* **Top 3 Recommendations & 1-Tutor Commitment**: Students review the top 3 matches and confirm exactly 1 tutor, immediately unlocking direct contact details (Phone, LINE ID, Email).
* **In-App & Email Notifications**: Real-time notifications and notification bells for tutors (upon lesson selection or admin verification status updates) backed by an asynchronous Amazon SES email worker.
* **Verified 4-Metric Reviews**: Gated reviews (Knowledge, Preparation, Clarity, Punctuality) submitted only by students who confirmed that tutor.

> 🤖 **For AI Agents (Gemini, GPT, Claude, Cursor) & Contributors:**  
> Read the complete requirements, 1–5 slider mapping, and system specification in [**`PROJECT_CONTEXT.md`**](./PROJECT_CONTEXT.md) (and [**`AGENTS.md`**](./AGENTS.md)). For full endpoint contracts, consult [**`docs/API_SPEC.md`**](./docs/API_SPEC.md).

---

## 🏗️ Architecture & Completed Modules

TutorPair is fully implemented across 8 core backend modules and client features:

| Module | Status | Core Endpoints / Capabilities | Documentation |
|---|---|---|---|
| **Module 2: Auth & Users** | ✅ Complete | `POST /api/auth/sync`, `GET /api/auth/me`, `POST /api/auth/mock-login`, `POST /api/auth/logout` | [API Spec](./docs/API_SPEC.md#part-0-module-2--authentication--user-management) • [Auth Flow](./docs/AUTH_FLOW.md) |
| **Module 3: Student Profile** | ✅ Complete | Profile CRUD, 1–5 style sliders, availability schedule matrix, subject interests (`/api/students/*`) | [API Spec](./docs/API_SPEC.md#part-1-module-3--student-profile--preferences) • [Frontend Guide](./docs/FRONTEND_GUIDE.md) |
| **Module 4: Tutor Profile & S3** | ✅ Complete | Tutor profile CRUD, subjects, rates, availability schedule, S3 presigned uploads (`/tutors/*`, `/documents/*`) | [API Spec](./docs/API_SPEC.md#part-2-module-4--tutor-profile--verification) • [S3 Docs](./docs/S3_DOCUMENTS.md) |
| **Module 5: Admin Verification** | ✅ Complete | Tutor application audit, S3 document view URLs, approve/reject decisions (`/admin/tutors/*`) | [API Spec](./docs/API_SPEC.md#module-5-admin-tutor-verification) |
| **Module 6: Tutor Matching** | ✅ Complete | 2-stage matchmaking engine (hard filters + weighted scoring), match confirmation (`POST /api/matching`, `/api/matching/:id/confirm`) | [API Spec](./docs/API_SPEC.md#module-6-tutor-matching) • [Algorithm Spec](./PROJECT_CONTEXT.md#33-two-stage-matchmaking-algorithm) |
| **Module 7: Results & Reviews** | ✅ Complete | Matching history, unlocked tutor details, 4-metric rating & review submission (`/api/matching/history`, `/api/reviews/*`, `/api/tutors/:id`) | [API Spec](./docs/API_SPEC.md#module-7-matching-results-history--reviews) |
| **Module 8: Notifications & SES** | ✅ Complete | In-app notification center, read/read-all endpoints, background Amazon SES email worker (`/api/notifications/*`) | [API Spec](./docs/API_SPEC.md#module-8-tutor-notifications--email-delivery-tp-13-tp-14) • [Notifications](./docs/NOTIFICATIONS.md) |

Detailed documentation is available in the [`docs/`](./docs/README.md) directory:
* [API Specification & Table of Contents](./docs/API_SPEC.md)
* [AI Agent & Full Project Context](./PROJECT_CONTEXT.md)
* [Agent Directives](./AGENTS.md)
* [Architecture Decisions](./docs/ARCHITECTURE.md)
* [Agreed Cloud Components](./docs/clouds/CLOUD_COMPONENTS.md)
* [Availability and Deployment Profiles](./docs/clouds/HIGH_AVAILABILITY.md)
* [Project Structure](./docs/PROJECT_STRUCTURE.md)
* [Backend Developer Guide](./docs/BACKEND_GUIDE.md)
* [Frontend Developer Guide](./docs/FRONTEND_GUIDE.md)
* [Flat Design System & Token Spec](./docs/DESIGN_SYSTEM.md)
* [Authentication & Role Sync Flow](./docs/AUTH_FLOW.md)
* [S3 Presigned URL Strategy](./docs/S3_DOCUMENTS.md)
* [Notifications Architecture](./docs/NOTIFICATIONS.md)
* [Database & Migration Guide](./docs/DATABASE.md)

---

## 📋 Prerequisites

Before running the project locally, ensure you have:
* **Node.js**: `v20.x` or later (tested on `v24.x`)
* **npm**: `v10.x` or later
* **Docker & Docker Compose**: (for local PostgreSQL 16 database)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run from the repository root to install all dependencies across all workspaces:
```bash
npm install
```

### 2. Build the Shared Package
Compile `@tutorpair/shared` (enums, schemas, types) so both backend and frontend can import it:
```bash
npm run build:shared
```

### 3. Start Local PostgreSQL Database
Spin up the local PostgreSQL 16 container:
```bash
docker compose up -d
```
*(This starts PostgreSQL on `localhost:5432` with user `postgres` and password `postgres`).*

### 4. Run Migrations & Seed Reference Data
Apply the initial database schema and seed predefined categories and subjects (Math, IELTS, SAT, etc.):
```bash
npm run db:migrate
npm run db:seed
```

### 5. Inspect Database (Drizzle Studio)
Visually inspect tables, columns, relations, and mock seed data in your browser:
```bash
npm run db:studio
```
Open: **[https://local.drizzle.studio](https://local.drizzle.studio)**

### 6. Start Development Servers

Open two terminal tabs:

**Terminal 1 — Backend API (Express on Port 4000):**
```bash
npm run dev:server
```
Health check endpoint: `http://localhost:4000/api/health`

**Terminal 2 — Frontend App (Vite on Port 5173):**
```bash
npm run dev:client
```
Open your browser at: `http://localhost:5173`

---

## ⚙️ Environment Variables Configuration

Copy `.env.example` to `.env.local` for local development:

```bash
# Server configuration
cp .env.example apps/server/.env.local

# Client configuration
cp .env.example apps/client/.env.local
```

### Local Development Without AWS (Mock Mode)
You **do not** need AWS credentials to develop features locally:
* **Cognito Mock Auth**: In development mode, you can call protected backend endpoints using:
  ```http
  Authorization: Bearer mock-token-<user-id>
  ```
  The backend will automatically bypass Cognito verification and map `<user-id>` to the database.
* **Frontend**: Loads without errors even if Cognito environment variables are blank.

### Connecting to Real AWS Services
When connecting to actual AWS services, fill in:
* `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
* `S3_BUCKET_NAME`
* `SES_FROM_EMAIL`
* `DATABASE_URL` (if pointing to Amazon RDS)

---

## 🛠️ Available Scripts (Root)

| Command | Description |
|---|---|
| `npm run build` | Compiles the shared package, backend server, and frontend client |
| `npm run build:shared` | Compiles `@tutorpair/shared` TypeScript definitions |
| `npm run build:server` | Compiles `apps/server` TypeScript into `dist/` |
| `npm run build:client` | Builds `apps/client` for production via Vite |
| `npm run dev:server` | Starts Express API in watch mode with hot reload |
| `npm run dev:client` | Starts Vite React frontend on `http://localhost:5173` |
| `npm run db:generate` | Generates a new SQL migration file after schema changes |
| `npm run db:migrate` | Runs all pending database migrations against PostgreSQL |
| `npm run db:seed` | Populates database with default subjects, variants, and categories |
| `npm run db:studio` | Opens Drizzle Studio GUI in your browser to inspect database tables |

---

## 📂 Repository Structure

```text
tutorpair/
├── apps/
│   ├── client/                  # React (Vite) Frontend -> AWS Amplify Hosting
│   │   ├── src/
│   │   │   ├── components/      # UI & form primitives (Button, Card, SliderInput, Modal)
│   │   │   ├── features/        # Feature pages (landing, auth, students, tutors, matching, admin, reviews, notifications)
│   │   │   ├── layouts/         # StudentLayout, TutorLayout, AdminLayout, AuthLayout
│   │   │   ├── routes/          # ProtectedRoute and role-based route guards
│   │   │   ├── services/        # Axios API client configured with Bearer token interceptor
│   │   │   └── store/           # Zustand client auth store
│   │   └── vite.config.ts
│   │
│   └── server/                  # Node.js/Express Backend -> Docker -> AWS ECS Fargate
│       ├── src/
│       │   ├── common/          # Middlewares, errors, responses, asyncHandler, auth guards
│       │   ├── config/          # Zod env validation, AWS SDK clients (S3, SES, Cognito)
│       │   ├── db/              # Drizzle ORM schemas, migrations, client, and seeder
│       │   ├── modules/         # Feature modules (routes -> controller -> service -> repository)
│       │   │   ├── auth/        # Authentication & Cognito sync
│       │   │   ├── users/       # User management
│       │   │   ├── students/    # Student profiles, sliders, availability
│       │   │   ├── tutors/      # Tutor profiles, subjects, rates, availability
│       │   │   ├── subjects/    # 3-step cascading subject & variant catalog
│       │   │   ├── documents/   # S3 presigned upload & delete workflows
│       │   │   ├── admin/       # Tutor application review & verification
│       │   │   ├── matching/    # Two-stage matching engine & match confirmation
│       │   │   ├── reviews/     # Verified 4-metric review submission & listing
│       │   │   └── notifications/# In-app notifications & read state management
│       │   └── workers/         # Background email dispatch worker (30s interval via SES)
│       ├── Dockerfile           # Production multi-stage Docker build
│       └── drizzle.config.ts
│
├── packages/
│   └── shared/                  # @tutorpair/shared
│       └── src/
│           ├── enums/           # UserRole, VerificationStatus, SubjectCategory, etc.
│           ├── schemas/         # Zod schemas for all domain requests and forms
│           └── types/           # Shared TypeScript interfaces & DTOs
│
├── docs/                        # Complete technical documentation & guides
├── docker-compose.yml           # Local PostgreSQL 16 backing container
└── package.json                 # Monorepo workspace configuration
```

---

## 📌 Development Conventions

1. **Shared Types First**: If an enum, type, or validation schema is used by both frontend and backend, define it in `packages/shared/` and run `npm run build:shared`. Never duplicate types.
2. **Error Handling**: Use semantic errors from `common/errors/http-errors.ts` (`NotFoundError`, `BadRequestError`, `ForbiddenError`, `ConflictError`). If a new error is needed, add it to `http-errors.ts` first.
3. **Async Controllers**: Wrap all controller handlers with `asyncHandler` to eliminate manual `try/catch` boilerplate.
4. **Cross-Module Rule**: A module's service may import another module's **repository**, but never another module's service (prevents circular dependencies).
5. **S3 Uploads**: File binaries never stream through Express. Use **S3 Presigned URLs** (`PUT` for upload, `GET` for view).
6. **Database Changes**: Always run `npm run db:generate` to produce a migration file, commit it to Git, and run `npm run db:migrate`. Never run `drizzle-kit push` on shared/production databases.
7. **Git Branch Naming**: All branches must follow the standard Jira format `<type>/mod-<ticket>-<short-description>`:

   ```text
   <type>/mod-<ticket-number>-<kebab-case-description>
   ```

   | Prefix | Purpose | Example |
   |---|---|---|
   | `feat/` | A new feature or user capability | `feat/mod-1-cascading-subjects` |
   | `fix/` | A bug fix for an existing issue | `fix/mod-12-auth-token-refresh` |
   | `refactor/` | Code refactoring without behavioral changes | `refactor/mod-8-repository-queries` |
   | `style/` | UI styling, CSS tokens, layout polishing | `style/mod-20-flat-design-cards` |
   | `docs/` | Documentation additions or updates | `docs/mod-3-api-documentation` |
   | `test/` | Adding or updating unit/integration tests | `test/mod-9-scoring-algorithm` |
   | `chore/` | Tooling, dependencies, or config changes | `chore/mod-15-update-deps` |
   | `hotfix/` | Critical emergency patch for production | `hotfix/mod-99-db-pool-leak` |
7. **Visual DB Verification with Drizzle Studio**: Whenever making database changes (schema modifications, migrations, or seeding), developers and AI agents must run `npm run db:studio` and inspect **[https://local.drizzle.studio](https://local.drizzle.studio)** to confirm tables, columns, constraints, and data.
8. **Testing Strategy**: Never commit untested code. Write **unit tests** for mathematical algorithms and business logic (e.g., 1–5 slider matching formulas, compatibility scoring, budget utility in `scoring.util.ts`) and **integration tests** for API endpoints (role validation, error responses). Run `npm test` before submitting changes.

