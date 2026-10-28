# Spec: Module 6 — Tutor Matching (Jira epic TP-4)

> Status: **Q1–Q7 answered; ready to implement.** Scope: TP-6 hard filtering, TP-7 compatibility scoring, TP-8 Top 3 ranking, TP-9 tutor selection.
> Workspaces: `apps/server`, `packages/shared`. No frontend work.
> Authority: repo docs. Where the docs say nothing, the behavior is marked **[SILENT]**, kept to the smallest version, and isolated in a named constant or function.

---

## 0. Pre-flight findings (these change the plan)

| # | Finding | Impact |
|---|---|---|
| F1 | `feat/mod-6-tutor-matching` sits at `1d2dc78`, the same commit as local `feat/mod-4-admin-verification`. **It was not branched from master.** `origin/master` (`22c9d9d`) has 7 Module 3 commits this branch lacks. Merging master in gives 5 conflicts (`API_SPEC.md`, `app.ts`, `authenticate-jwt.ts`, 2 client files). | The Module 3 → 6 contract (`studentsRepository.getProfileWithAvailability`, `StudentWithAvailabilityDto`, `grade_level` regex `G1`–`G12`) exists **only on origin/master**. On this branch `studentsRepository = {}`. → Open question Q1. |
| F2 | `API_SPEC.md` on this branch has only Modules 4 and 5. The "Module 3 → Module 6" contract is in `origin/master:docs/API_SPEC.md` §1. Neither version has a Module 6 section. | We write a new Module 6 section in API_SPEC.md. |
| F3 | `match_requests` has **no `variant_id`** column. Each recommendation's score is stored, but not which subject was requested. | Not needed for TP-6–9. Needed for Module 7 history, and requests made before the column exists can never be backfilled. → Q2. |
| F4 | `hourly_rate` is stored **per variant** (`tutor_subjects.hourly_rate`), not per tutor. | Budget scoring uses the tutor's rate **for the requested variant**. |
| F5 | `notificationService.createNotification` writes through the global `db` client, so it cannot join a transaction. NOTIFICATIONS.md requires the notification to be saved "with the business change in one transaction". | Add an optional transaction executor parameter to `notificationRepository.create` / `createNotification`. Existing callers keep working. |
| F6 | `API_SPEC.md` (Module 4 header): *"All tutoring sessions and matchmaking are conducted **Online by default**."* | This lets us skip the Online/Onsite mode filter: every tutor passes it. We still report it, because PROJECT_CONTEXT §3.3 lists the filter. |
| F7 | The tutor client (`SubjectSelector.tsx`) requires ≥1 grade **only** when `learning_goal === SCHOOL_CURRICULUM`. | This confirms the grade filter applies to `SCHOOL_CURRICULUM` only, not to all of `GENERAL_LEARNING` (e.g. not to `COMPETITIONS`). |
| F8 | `mock-token-<x>` resolves `<x>` as the **cognito_sub**, not `users.id`. The seed student has `cognito_sub = 'mock-student-id'`. | The sample curl uses `mock-token-mock-student-id`. |
| F9 | The draft `scoring.util.ts` silently replaces missing sliders with `?? 3`. Its comment says "at budget → 0.8", but the formula actually gives 0.5. | Replace the default with validation, and fix the comment. |

---

## 1. Objective

A STUDENT picks a subject variant in the 3-step selector and gets the **Top 3 most compatible APPROVED tutors**. The system computes them deterministically from the student's saved Module 3 profile. The student then confirms **exactly one** of them, and that tutor gets an in-app notification plus a queued email.

**Users:** STUDENT (calls both endpoints). TUTOR (receives `TUTOR_SELECTED`).

**Success looks like:** the same profile and the same tutor pool always give the same Top 3 in the same order, in under 3 s. A request can be confirmed once only, including under concurrency, and a confirmation always produces exactly one notification row.

---

## 2. Business logic per subtask

### TP-6 — Stage 1 hard filters (pure boolean gate)

A candidate is a tutor who teaches the requested variant. The tutor **survives** only if **all** of these hold:

| Gate | Rule | Source |
|---|---|---|
| G1 Verified | `tutors.verification_status === 'APPROVED'` | PROJECT_CONTEXT §3.3 |
| G2 Variant | a `tutor_subjects` row exists with `variant_id === requested variant_id`. Same subject but a different variant (Math-Primary vs Math-Secondary) → eliminated. | §3.3 "exact match" |
| G3 Grade | if `variant.learning_goal === 'SCHOOL_CURRICULUM'`: `tutor_subjects.grade_levels` includes `student.grade_level`. Any other learning goal skips this gate. | §3.3, F7 |
| G4 Availability | ≥1 pair (student slot, tutor slot) on the **same `day_of_week`** with `max(start) < min(end)` | §3.3 |
| ~~G5 Mode~~ | skipped: no column, and API_SPEC says everything is online (F6) | **[SILENT/GAP]** |

**Decisions and ideas:**
- **Overlap is strict.** Slots that only touch, like `16:00–17:00` and `17:00–18:00`, do **not** overlap. Times are compared in seconds, because the DB returns `HH:MM:SS` and the input uses `HH:mm`.
- **Minimum overlap length [SILENT].** The docs say "≥1 overlapping slot", but a 1-minute overlap can't hold a lesson. Smallest version: `MIN_OVERLAP_MINUTES = 1`, i.e. any positive overlap counts. Business idea: set it to `60` so every survivor can actually hold a one-hour session. → Q4.
- **Curriculum variant with null/empty `grade_levels` → eliminated.** The gate is strict, and an unknown grade support is not proof of support. The tutor UI already blocks this case (F7), so it only affects legacy or seed rows.
- **Where the logic lives:** `passesHardFilters(candidate, student, variant)` and `hasAvailabilityOverlap(a, b)` are pure functions in `common/utils/scoring.util.ts`. BACKEND_GUIDE §9.1 names that file for "availability intersection logic", and the 4-file module rule leaves no other place for them. The repository narrows the query in SQL by G1+G2 for speed. The pure function re-checks **all** gates, so unit tests cover every gate without a DB.
- **No N+1:** one query (`tutors ⋈ tutor_subjects[variant] ⟕ availabilities`) returns rows of tutor × slot, which are grouped in JS. Plus one variant lookup, plus the Module 3 profile call.

### TP-7 — Stage 2 weighted compatibility score (0–100)

The baseline is kept as-is: **Manhattan distance**, weights **style 45 / personality 35 / budget 20**.

```
styleScore       = 1 − Σ|sᵢ − tᵢ| / 20        (5 sliders, max diff 4 each)
personalityScore = 1 − Σ|sᵢ − tᵢ| / 16        (4 sliders)
budgetScore      = rate > budget ? 0 : 0.5 + 0.5 · (1 − rate / budget)
base             = 100 · (0.45·style + 0.35·personality + 0.20·budget)
modifier         = (pref ≠ ANY and pref ≠ tutor_type) ? −TUTOR_TYPE_MISMATCH_PENALTY : 0
score            = round2( clamp(base + modifier, 0, 100) )
```

- **Validation:** style must be exactly 5 integers and personality exactly 4, each in 1–5, for **both** student and tutor. Otherwise → `BadRequestError`. The `?? 3` fallback is removed.
- **Tutor-type modifier [SILENT magnitude]:** `TUTOR_TYPE_MISMATCH_PENALTY = 10` points, applied **only on mismatch**. `ANY` and an exact match are untouched, so `ANY` never penalizes. Why a penalty and not a bonus: a bonus pushes perfect-fit tutors past 100, and clamping them would erase their order at the top. A penalty keeps the score readable as "% compatible". → Q3.
- **Gender preference:** skipped, because no column exists. **[SILENT/GAP]**
- **Determinism:** pure arithmetic with no clock, randomness or locale. Rounding to 2 decimals matches `decimal(5,2)`.

**Worked numbers (budget 500฿), so the business impact is visible:**

| Tutor | Sliders | Rate | Type pref | Score |
|---|---|---|---|---|
| A | identical | 500 | match | **90.00** |
| B | identical | 250 | match | **95.00** |
| C | identical | 501 (1฿ over) | match | **80.00** |
| D | each off by 1 | 500 | match | **70.00** |
| E | identical | 500 | mismatch | **80.00** |

Two consequences to accept or change (→ Q5):
1. **Over budget is not a hard filter.** The docs put budget in Stage 2 only, so an over-budget tutor with a perfect fit (C, 80) **outranks** an in-budget tutor with a near fit (D, 70).
2. **Cheaper always scores higher, and there is a cliff at the budget line.** 1฿ over budget costs 10 points. The mermaid chart says "budget *proximity*", while the draft formula rewards *cheapness*. We keep the draft as the baseline.

### TP-8 — `POST /api/matching` (Top 3)

- Middleware order: `authenticate → requireRole(['STUDENT']) → validateRequest(MatchRequestSchema)`.
- **Shared schema trim:** `MatchRequestSchema = { variant_id: uuid }`. All other fields come from the profile (Module 3 contract). The unused `AvailabilitySlotSchema` in `matching.schema.ts` is deleted, since the Student and Tutor slot schemas already exist.
- **Flow:**
  1. `studentsRepository.getProfileWithAvailability(userId)` → if `null`: `NotFoundError('Student profile not found')`.
  2. Variant lookup → if unknown: `NotFoundError('Subject variant not found')`.
  3. Student has **zero availability slots** **[SILENT]** → recommendation: `UnprocessableEntityError('Set your weekly availability before matching')`, instead of a silent empty list (→ Q6).
  4. Load candidates → Stage 1 → Stage 2.
  5. Sort by **rounded score desc**, then `tutor_id` asc using plain `<` (not `localeCompare`, which is locale-dependent). Take ≤3 and assign rank 1..n. Sorting on the rounded score keeps the order consistent with the scores shown to the student.
  6. In **one transaction**: insert `match_requests` (status `PENDING`) and its 0–3 `match_recommendations`.
  7. Zero survivors → still persist the request, and return `recommendations: []` with `200` **[SILENT]**. This keeps one code path, and Module 7 history can show "no match found".
- **Response `200`:**
  ```json
  { "success": true, "data": {
      "match_request_id": "uuid", "variant_id": "uuid", "status": "PENDING",
      "recommendations": [{
        "recommendation_id": "uuid", "rank": 1, "score": 95.0,
        "tutor": { "tutor_id": "uuid", "first_name": "…", "last_name": "…", "description": "…",
                   "tutor_type": "UNDERGRADUATE", "average_rating": 4.5, "review_count": 12,
                   "hourly_rate": 250 } }] } }
  ```
  The response is built from an explicit select list (allow-list), so `phone_number`, `line_id`, `rejection_reason` and document keys **cannot** leak, even if the schema changes later.
- **Status values:** `'PENDING' | 'CONFIRMED'` become a `MatchRequestStatus` enum in `packages/shared` (the column stays `varchar`, so no migration).
- **Performance:** at most 4 round-trips, with the candidate set bounded by one variant. This is comfortably under 3 s at project scale. Index idea (needs a migration, deferred): `tutor_subjects(variant_id)`, because the PK `(tutor_id, variant_id)` cannot serve a lookup by `variant_id` alone.

### TP-9 — `POST /api/matching/:matchRequestId/confirm`

- Middleware: `authenticate → requireRole(['STUDENT']) → validateRequest(ConfirmTutorSelectionSchema)`. The body is `{ recommendation_id, tutor_id }`, as already defined in shared.
- **One transaction, in this order:**
  1. `SELECT … FROM match_requests WHERE id = :id FOR UPDATE`. The row lock makes concurrent confirms wait for each other.
  2. Missing request, **or** `student_id ≠ caller` → `NotFoundError`. Both look the same to the caller, so we don't reveal that someone else's request exists.
  3. `status === 'CONFIRMED'` → `ConflictError`.
  4. `recommendation_id` is not in this request → `NotFoundError`. The recommendation exists but its `tutor_id ≠ body.tutor_id` → `UnprocessableEntityError`.
  5. Set `match_requests.status = 'CONFIRMED'` and `match_recommendations.is_selected = true` (that one row only).
  6. `notificationService.createNotification({ userId: tutor_id, eventType: TUTOR_SELECTED, message: 'A student has selected you as their tutor. Please check your contact details.', requiresEmail: true }, tx)`.
- The second concurrent confirm blocks on the lock, then sees `CONFIRMED` and returns `409`. Result: exactly one `is_selected = true` and exactly one notification row.
- **Response `200`:** `{ match_request_id, status: 'CONFIRMED', selected: { recommendation_id, tutor_id } }`. **No contact details.** Revealing them belongs to Module 7 / TP-10.
- No SES call. The existing worker picks up rows with `email_status = PENDING`.

**Ideas the docs are silent on (not implemented unless you say so → Q7):**
- **Tutor no longer APPROVED at confirm time** (revoked between match and confirm). The recommendation is accepted as-is, with no re-check.
- **Several PENDING requests per student.** Each `POST /api/matching` creates a new request, so a student can confirm one tutor on each of several requests for the same subject. "Exactly 1 tutor" is enforced **per request** only.
- **Request expiry.** None.

---

## 3. Tech stack

Node 20, Express 4, TypeScript 5.4, Drizzle ORM 0.45 (node-postgres), Zod 3.23, PostgreSQL 16. Tests use `node:test` + `node:assert/strict`, run through `tsx --test`. No new dependencies.

## 4. Commands

```bash
npm run build:shared                      # after editing packages/shared
npm run build                             # type-check all workspaces
npm test                                  # all workspaces (server: tsx --test src/**/*.test.ts)
npm run dev:server                        # API on :4000 (NODE_ENV=development for mock auth)
docker compose up -d && npm run db:migrate && npm run db:seed   # local DB for integration tests
# only if Q2 = yes:
npm run db:generate && npm run db:migrate && npm run db:studio  # → https://local.drizzle.studio
```

Sample:
```bash
curl -X POST http://localhost:4000/api/matching \
  -H "Authorization: Bearer mock-token-mock-student-id" \
  -H "Content-Type: application/json" \
  -d '{"variant_id":"<uuid from GET /api/subjects>"}'
```

## 5. Project structure (files touched)

```
packages/shared/src/schemas/matching.schema.ts   trim MatchRequestSchema, drop AvailabilitySlotSchema
packages/shared/src/enums/index.ts               + MatchRequestStatus
packages/shared/src/types/index.ts               + MatchResultDto, MatchRecommendationDto, ConfirmSelectionResultDto
apps/server/src/common/utils/scoring.util.ts     validation, modifier, hard filters, overlap, rankTop3
apps/server/src/common/utils/scoring.util.test.ts   NEW: unit tests (TP-6/7/8 pure logic)
apps/server/src/common/notifications/notification.{service,repository}.ts   optional tx executor
apps/server/src/modules/matching/matching.{routes,controller,service,repository}.ts
apps/server/src/modules/matching/matching.service.test.ts        NEW: unit, repos mocked (like tutors.service.test.ts)
apps/server/src/modules/matching/matching.integration.test.ts    NEW: HTTP + DB (like tutors.integration.test.ts)
docs/API_SPEC.md                                 + Module 6 section
(Q2 only) apps/server/src/db/schema/matching.schema.ts + migrations/000N_*.sql
```

## 6. Code style

Follow the existing modules: object-literal singletons (`export const matchingService = { async findTop3(...) {...} }`), `.js` import suffixes, snake_case DTO fields, decimals converted with `Number(...)` at the repository edge, typed errors only, and `asyncHandler` + `successResponse` in controllers.

```ts
export const runMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchingService.findTop3(req.user!.id, req.body);
  res.status(200).json(successResponse(result));
});
```

## 7. Testing strategy

| Level | File | Covers |
|---|---|---|
| Unit (pure, no DB) | `scoring.util.test.ts` | Each gate in both directions: Math vs Science eliminated; G12 tutor vs G6 student eliminated on a curriculum variant and kept on a non-curriculum one; PENDING/REJECTED eliminated; no overlap, touching endpoints and other-day slots eliminated; partial overlap kept. Distance: identical → max, opposite → 0, out-of-range / wrong length → `BadRequestError`. Budget: under / at / over / rate 0. Modifier: ANY, match, mismatch, clamp at 0. Determinism (same input twice → same output), tie ordering by `tutor_id`, ≤3 results. |
| Unit (repos mocked) | `matching.service.test.ts` | Missing profile → 404, unknown variant → 404, no slots → 422, zero survivors → `[]`, confirm error mapping (404/404/409/422). |
| Integration (DB) | `matching.integration.test.ts` | 401 without token, 403 for TUTOR and ADMIN, 400 for malformed body, 404 for unknown ids, response shape, mock-token auth, **no contact fields** (deep key scan), persisted rows; confirm → exactly 1 `is_selected`, 1 `TUTOR_SELECTED` row with `requires_email = true`; second confirm → 409; **two parallel confirms → one 200 + one 409** (BACKEND_GUIDE §9). |

Integration tests need the local Postgres, the same as the existing `tutors.integration.test.ts`. They insert their own fixtures with unique `cognito_sub`s and delete them in `after()`.

## 8. Boundaries

- **Always:** shared package first, then `build:shared`; a failing test before each implementation; one commit per TP (`feat(matching): … (TP-N)`); repository-only cross-module imports; typed errors; allow-listed response fields; keep mock auth working.
- **Ask first:** the branch rebase/merge (Q1); any schema change or migration (Q2); changing weights or formula shape (Q5); adding filters or response fields beyond this spec.
- **Never:** `drizzle-kit push`; SES calls in a request path; service→service imports; returning `phone_number` / `line_id` / `rejection_reason` / documents; push, open a PR, or touch Jira; frontend changes.

## 9. Success criteria

1. `npm run build` and `npm test` pass with no skipped tests.
2. `POST /api/matching` returns ≤3 recommendations ranked 1..n with scores in `[0,100]`, and both tables are persisted in one transaction.
3. Running the same request twice gives the same tutor order and scores.
4. The response JSON contains none of the forbidden keys at any depth.
5. Parallel confirms on one request → exactly one 200 and one 409, one `is_selected = true`, one notification with `requires_email = true` and `email_status = 'PENDING'`.
6. `docs/API_SPEC.md` documents both endpoints, matching the code.

## 10. Open questions (need your call)

- **Q1 — Branch base (blocking).** Recommended: **reset `feat/mod-6-tutor-matching` onto `origin/master`**. Nothing is lost, because every commit on it is also on `feat/mod-4-admin-verification`. The result is a clean Module 6 diff with no conflicts. Matching needs nothing from Module 4: tests insert APPROVED tutors directly. Alternative: merge `origin/master` in and resolve 5 conflicts, in which case the PR will also carry the unmerged Module 4 work.
- **Q2 — Add `match_requests.variant_id`?** It isn't needed for TP-6–9, but Module 7 history must show the subject, and rows created before the column exists can never be backfilled. Recommended: **yes**, as a `NOT NULL` FK in one migration (the table is still empty everywhere). → Drizzle Studio check.
- **Q3 — Tutor-type mismatch penalty:** is 10 points OK? (The table above shows the effect.)
- **Q4 — `MIN_OVERLAP_MINUTES`:** 1 (literal docs) or 60 (one bookable lesson)?
- **Q5 — Budget behavior:** keep the baseline (over budget is soft, cheaper is better), or change it (e.g. make over-budget a hard filter, or score by proximity)? Changing it alters a stated weight shape, so it needs your sign-off.
- **Q6 — Student with no availability:** 422 with a clear message (recommended), or `200 []`?
- **Q7 — Out of scope unless you opt in:** re-checking APPROVED at confirm time; limiting a student to one open request per variant; adding `teaching_focus` to the public tutor card (it is public, per-variant marketing text and useful to students).

## 11. Decisions (answered)

- Q1: keep `feat/mod-6-tutor-matching`; `origin/master` merged in (commit 922593e).
- Q2: yes, add `match_requests.variant_id` (NOT NULL FK) via migration.
- Q3: `TUTOR_TYPE_MISMATCH_PENALTY = 10`.
- Q4: `MIN_OVERLAP_MINUTES = 60`.
- Q5: keep the baseline budget formula.
- Q6: student with no availability gets 422 with a clear message.
- Q7: yes to all three: re-check APPROVED at confirm, one open request per student and variant, `teaching_focus` on the tutor card.
  These add behavior not in the original plan; each gets a named test and a line in the final "Docs are silent" list.
