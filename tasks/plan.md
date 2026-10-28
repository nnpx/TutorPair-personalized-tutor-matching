# Implementation Plan: Module 6 — Tutor Matching (TP-4)

> Source: [SPEC.md](../SPEC.md). Status: **DRAFT, awaiting approval of the spec and its open questions Q1–Q7.**
> Jira (TP-6..TP-9) is the team tracker but stays untouched on this branch. Tasks are tracked in [todo.md](./todo.md).

## Overview

Two-stage, deterministic matching. **Stage 1** is a pure hard-filter gate (TP-6), **Stage 2** is a weighted 0–100 score (TP-7). They are combined behind `POST /api/matching`, which persists the Top 3 (TP-8). `POST /api/matching/:id/confirm` then locks the request, selects one tutor and queues a `TUTOR_SELECTED` notification in the same transaction (TP-9). Each TP is built test-first and ends in one commit `feat(matching): <summary> (TP-N)`.

## Architecture decisions

| Decision | Rationale |
|---|---|
| All pure matching logic goes in `common/utils/scoring.util.ts`: `hasAvailabilityOverlap`, `passesHardFilters`, `calculateCompatibilityScore`, `rankTop3` | BACKEND_GUIDE §9.1 names this file for slider, budget and availability-intersection logic. The 4-file module rule leaves no room for a 5th file in `modules/matching/`. |
| SQL narrows candidates by APPROVED + variant, and the pure function re-checks **all** gates | Every gate can be unit-tested without a DB. SQL keeps the candidate set small, so there is one batched query and no N+1. |
| Responses are built from an explicit column allow-list in the repository `select({...})` | Contact or verification fields cannot leak, even when the tutors schema gains columns. |
| Confirm uses `SELECT … FOR UPDATE` on `match_requests` inside `db.transaction` | Two concurrent confirms are serialized: the second sees `CONFIRMED` and gets a 409. This works across multiple API processes (HA requirement in BACKEND_GUIDE §9). |
| `notificationRepository.create(data, executor = db)` and `createNotification(params, executor?)` | This is the smallest change that lets the notification join the business transaction, as NOTIFICATIONS.md requires. Admin and other existing callers stay unchanged. |
| A `MatchRequestStatus` enum in shared, with the DB column kept as `varchar` | No migration, and the two status strings stop being magic values. |
| Sorting uses the rounded score desc, then `tutor_id` with plain `<` | The order matches the displayed scores, and the comparison is locale-independent, so results are deterministic. |

## Dependency graph

```
Phase 0: branch base (Q1) ──► baseline green
                                   │
        ┌──────────────────────────┴───────────────┐
TP-6 pure gates + overlap (T1)           TP-7 score validation + modifier (T3)
        │                                          │
TP-6 candidate query (T2)                          │
        └──────────────┬───────────────────────────┘
          TP-8 shared contract (T4) ──► [Q2: variant_id migration (T5)]
                       │
          TP-8 rankTop3 + findTop3 service (T6)
                       │
          TP-8 route + persist + integration + API_SPEC (T7)
                       │
          TP-9 tx-aware notifications (T8)
                       │
          TP-9 confirmSelection + route + concurrency test + API_SPEC (T9)
```

TP-6 and TP-7 don't depend on each other and could run in parallel. They stay sequential here because you asked for the TP-6 → TP-9 order and a commit per TP. TP-6 and TP-7 are foundation layers with no endpoint of their own. The first full vertical slice is TP-8, because nothing user-visible exists until the route does.

## Phases and tasks

### Phase 0 — Correct base (blocking)
- **T0** Rebase the branch per Q1 (recommended: `git reset --hard origin/master`; nothing is lost because every commit is on `feat/mod-4-admin-verification`). Run `npm install`, `npm run build`, `npm test`, and record the baseline.

**Checkpoint 0:** `studentsRepository.getProfileWithAvailability` exists, and the baseline build and tests pass (any pre-existing failures noted, not fixed).

### Phase 1 — TP-6 hard filtering
- **T1** Pure gates: `hasAvailabilityOverlap`, `passesHardFilters` + unit tests (red → green).
- **T2** `matchingRepository.findVariantById`, `findCandidateTutors(variantId)`: one query that returns tutors with their variant row and slots.
- Commit `feat(matching): add stage-1 hard filters and candidate query (TP-6)`.

### Phase 2 — TP-7 scoring
- **T3** Validation (`BadRequestError`), removal of the `?? 3` fallback, the tutor-type modifier constant, the comment fix + unit tests.
- Commit `feat(matching): validate sliders and add tutor-type modifier to scoring (TP-7)`.

**Checkpoint 1–2:** `npm test` is green. Every gate is tested in both directions. The score formula matches SPEC §2 TP-7, including the 5 worked numbers as test cases. **Human review of the constants before the endpoint goes live.**

### Phase 3 — TP-8 Top 3 endpoint
- **T4** Shared contract: trim `MatchRequestSchema`, delete `AvailabilitySlotSchema`, add the `MatchRequestStatus` enum and result DTO types, then `npm run build:shared`.
- **T5** *(only if Q2 = yes)* Add `match_requests.variant_id`, then `npm run db:generate`, commit the SQL, `npm run db:migrate` → **Drizzle Studio check**.
- **T6** `rankTop3` (pure) + `matchingService.findTop3`, with service unit tests (repos mocked).
- **T7** Routes, controller, `matchingRepository.createRequestWithRecommendations` (one tx), integration tests, and the API_SPEC Module 6 section for this endpoint.
- Commit `feat(matching): add POST /api/matching top-3 ranking (TP-8)`.

**Checkpoint 3:** the sample curl returns ≤3 ranked tutors, both tables are filled (and inspected in Drizzle Studio if T5 ran), and a deep scan finds no forbidden keys.

### Phase 4 — TP-9 selection
- **T8** Transaction-aware `createNotification` + unit test, keeping existing callers green.
- **T9** `confirmSelection` (lock → checks → updates → notify), route, unit + integration tests including parallel confirms, and API_SPEC for the confirm endpoint.
- Commit `feat(matching): add tutor selection confirm with TUTOR_SELECTED notification (TP-9)`.

**Checkpoint 4 (final):** `npm run build` and `npm test` are green. The parallel confirm test gives exactly one 200 and one 409. A notification row exists with `requires_email = true` and `email_status = 'PENDING'`. Then the final report: commands, curl, the "Docs are silent" list, and Drizzle Studio instructions if T5 ran.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The branch base is wrong (F1): building on it means a later painful merge, or a PR that silently drags Module 4 along | High | Phase 0 is blocking. Don't start T1 until Q1 is answered. |
| Integration tests need a running Postgres; `npm test` fails without one | Med | This is the same precondition as the existing `tutors.integration.test.ts`. Commands are documented, and fixtures use unique `cognito_sub`s plus `after()` cleanup. |
| The concurrency test is flaky (both requests serialize before the lock matters) | Med | Fire both confirms with `Promise.all` against the HTTP server, and assert on the **multiset** `{200, 409}` plus the DB row counts, not on which request wins. |
| Drizzle `.for('update')` inside a `tx` | Low | Supported by pg-core 0.45. If not, fall back to ``tx.execute(sql`… FOR UPDATE`)`` inside the repository only. |
| The notification signature change breaks callers | Low | The new parameter is optional with default `db`. Grep callers in T8, and run admin tests. |
| Time format mismatch (`HH:mm` vs `HH:MM:SS`) breaks the overlap check | Med | Parse to seconds in one helper, and unit-test mixed formats. |
| A tutor row with malformed sliders (legacy or seed data) makes scoring throw 400 for the whole request | Med | Seed and Module 4 validation already enforce lengths. A test documents the behavior. If it happens in practice, raise it with you rather than silently skipping the tutor. |
| A cheap trick quietly changes the business rules (weights, budget cliff) | Med | The constants are named, and the 5 worked numbers from the spec are locked in as tests. Any change needs Q5 sign-off. |

## Open questions

See SPEC.md §10: **Q1 (blocking)**, then Q2 (decides whether T5 exists), Q3–Q6 (constant values and one edge-case status code), and Q7 (opt-ins).
