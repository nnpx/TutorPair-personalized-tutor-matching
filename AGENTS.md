# Agent Instructions for TutorPair

This repository contains the **TutorPair** project, a cloud-native tutor matchmaking platform for G1–G12 students and tutors in Thailand.

Before generating plans or modifying code, **all AI agents (Gemini, GPT, Claude, Cursor, Copilot) must consult the documentation references below.**

---

## 📖 1. Domain & Business Requirements

For all product requirements, user roles, 1–5 slider matching questions, 3-step subject cascading selection logic, 4-category review structure, and AWS cloud architecture:

👉 Consult [**`PROJECT_CONTEXT.md`**](./PROJECT_CONTEXT.md)

---

## 📚 2. Architecture & Technical Documentation Index

All architectural decisions, coding conventions, database patterns, and security workflows are fully documented in the [`docs/`](./docs/README.md) directory. **Do not invent new patterns**—refer to the specific document for your task:

| If you are working on... | Consult Documentation File |
|---|---|
| **High-level decisions & Tech stack rationale** | [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) |
| **Monorepo folder structure & directory guide** | [**`docs/PROJECT_STRUCTURE.md`**](./docs/PROJECT_STRUCTURE.md) |
| **Backend routes, controllers, services, repositories & errors** | [**`docs/BACKEND_GUIDE.md`**](./docs/BACKEND_GUIDE.md) |
| **Frontend state, forms, UI components & route guards** | [**`docs/FRONTEND_GUIDE.md`**](./docs/FRONTEND_GUIDE.md) |
| **Frontend UI, styling, Flat Design tokens & aesthetics** | [**`docs/DESIGN_SYSTEM.md`**](./docs/DESIGN_SYSTEM.md) |
| **Database schemas, Drizzle ORM, & migration workflow** | [**`docs/DATABASE.md`**](./docs/DATABASE.md) |
| **Authentication, AWS Cognito, role sync, & local mock auth** | [**`docs/AUTH_FLOW.md`**](./docs/AUTH_FLOW.md) |
| **S3 document uploads, CVs, certificates, & Presigned URLs** | [**`docs/S3_DOCUMENTS.md`**](./docs/S3_DOCUMENTS.md) |
| **Notifications, in-app alerts, & Amazon SES email worker** | [**`docs/NOTIFICATIONS.md`**](./docs/NOTIFICATIONS.md) |
| **Index of all architectural rules & non-negotiables** | [**`docs/README.md`**](./docs/README.md) |

---

## ⚡ 3. Quick Non-Negotiables for AI Agents

1. **Shared Workspace Priority**:
   * Shared schemas, enums, and types live in `packages/shared/src/`.
   * When changing an enum, schema, or DTO, update `packages/shared` first and run `npm run build:shared`. Never duplicate types across workspaces.
2. **Follow Existing Module Patterns**:
   * Strictly adhere to the layer rules and conventions in [`docs/BACKEND_GUIDE.md`](./docs/BACKEND_GUIDE.md) and [`docs/FRONTEND_GUIDE.md`](./docs/FRONTEND_GUIDE.md).
3. **Strict Flat Design Aesthetic**:
   * Every frontend page/component must follow [**`docs/DESIGN_SYSTEM.md`**](./docs/DESIGN_SYSTEM.md) — zero drop shadows, no glassmorphism or blur, bold Outfit typography, and solid color-block hierarchy.
4. **No Direct File Streaming**:
   * File uploads must use S3 Presigned URLs as specified in [`docs/S3_DOCUMENTS.md`](./docs/S3_DOCUMENTS.md).
5. **Database Changes via Migrations Only**:
   * Never run `drizzle-kit push` on shared/production environments; always generate and run migrations per [`docs/DATABASE.md`](./docs/DATABASE.md).
6. **Preserve Local Mock Auth**:
   * Keep the mock authentication bypass (`Authorization: Bearer mock-token-<user-id>`) functional as described in [`docs/AUTH_FLOW.md`](./docs/AUTH_FLOW.md).
7. **Mandatory Human Verification via Drizzle Studio**:
   * Whenever modifying database schemas (`*.schema.ts`), generating migrations, or writing seed data, **you MUST explicitly instruct the human developer to run `npm run db:studio` and inspect `https://local.drizzle.studio`** to visually confirm tables, relations, and data.
8. **Testing & Verification Mandate**:
   * Never commit untested code. Write unit tests for formulas/calculations (`scoring.util.ts`, 1–5 slider matching algorithms) and integration tests for API endpoints. **Always tell the user the exact command to run tests (`npm test`) and how to verify the feature.**

