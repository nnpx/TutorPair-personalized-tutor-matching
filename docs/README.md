# TutorPair — Documentation Index

This folder contains all architectural decisions, conventions, and constraints agreed upon by the team before development began. Every team member is expected to read all files before writing code.

> **Rule:** If something is not documented here, raise it with the team before implementing it. Do not make architectural decisions unilaterally.

---

## Files in This Folder

| File | Who Should Read | Purpose |
|---|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Everyone | High-level decisions: why we chose each technology and approach |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Everyone | Full folder structure for both frontend and backend with explanation of each directory |
| [BACKEND_GUIDE.md](./BACKEND_GUIDE.md) | Backend devs | Module anatomy, cross-module rules, env vars, migration workflow, error handling |
| [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) | Frontend devs | State management, form handling, route guards, folder conventions |
| [AUTH_FLOW.md](./AUTH_FLOW.md) | Everyone | How AWS Cognito, JWT, and PostgreSQL role sync work end-to-end |
| [S3_DOCUMENTS.md](./S3_DOCUMENTS.md) | Backend + Frontend devs | Presigned URL upload and view flows with sequence diagrams |
| [NOTIFICATIONS.md](./NOTIFICATIONS.md) | Backend devs | In-app notification + SES email async polling architecture |
| [DATABASE.md](./DATABASE.md) | Backend devs | Drizzle ORM conventions, migration workflow, schema organization |

---

## Quick Reference: The Non-Negotiables

These rules are agreed and must not be broken without a team discussion:

1. **Monorepo**: All code lives in one repository under `apps/` and `packages/`.
2. **Shared types**: All enums, Zod schemas, and DTOs shared between frontend and backend live in `packages/shared/`. Never duplicate them.
3. **Module isolation**: Backend developers work inside their assigned module folder. Do not modify another module's files without coordination.
4. **No secrets in code**: Never commit `.env` files, passwords, or AWS credentials. Use `.env.local` locally and AWS Secrets Manager in production.
5. **Migration files only**: Use `drizzle-kit generate` + `npm run db:migrate`. Never use `drizzle-kit push` on a shared or production database.
6. **Presigned URLs for S3**: No file binary data ever passes through the Express server. Always use S3 Presigned URLs.
7. **Role enforcement is always on the backend**: Frontend route guards are UX only. Backend `requireRole` middleware is the real security gate.
