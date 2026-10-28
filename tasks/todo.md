# Todo: Module 6 — Tutor Matching (TP-4)

Plan: [plan.md](./plan.md) · Spec: [../SPEC.md](../SPEC.md)
Server test command: `npm test --workspace=server` · Full: `npm run build && npm test`

---

## Phase 0 — Correct base

### T0: Put the branch on origin/master (Q1)
**Description:** Make `feat/mod-6-tutor-matching` contain the Module 3 contract, and confirm a clean baseline.
**Acceptance:**
- [x] `git merge-base --is-ancestor origin/master HEAD` succeeds (merged, 922593e)
- [x] `studentsRepository.getProfileWithAvailability` exists
**Verify:** `npm install && npm run build:shared && npm run build && npm test` (record any pre-existing failures)
**Depends on:** Q1 answer · **Files:** none (git only) · **Size:** XS

### Checkpoint 0
- [x] Baseline: shared/server/client build pass; unit tests pass; integration tests need Postgres (not available locally) · [x] Human OK to start TP-6

---

## Phase 1 — TP-6 Hard filtering

### T1: Pure hard-filter gates
**Description:** Add `hasAvailabilityOverlap(studentSlots, tutorSlots)` (same day, `max(start) < min(end)`, compared in seconds, `MIN_OVERLAP_MINUTES`) and `passesHardFilters(candidate, student, variant)` (APPROVED, variant, SCHOOL_CURRICULUM grade, overlap). Tests are written first.
**Acceptance:**
- [x] Each gate tested in both directions: Math vs Science eliminated; G12 tutor / G6 student eliminated on SCHOOL_CURRICULUM and kept on STANDARDIZED_EXAMS; PENDING and REJECTED eliminated; no overlap / touching / other day eliminated; partial overlap kept
- [x] Curriculum variant with null `grade_levels` eliminated; `HH:mm` vs `HH:MM:SS` compare correctly
**Verify:** `npm test --workspace=server` (new tests red first, then green)
**Depends on:** T0 · **Files:** `common/utils/scoring.util.ts`, `common/utils/scoring.util.test.ts` · **Size:** S

### T2: Candidate query (no N+1)
**Description:** `matchingRepository.findVariantById(id)` and `findCandidateTutors(variantId)`. One query joins `tutors ⋈ tutor_subjects ⟕ availabilities`, filtered by APPROVED + variant, and is grouped in JS into candidates with `hourly_rate: Number`, `grade_levels`, sliders and slots. Only the allow-listed public columns are selected, plus the private filter inputs.
**Acceptance:**
- [x] One SQL statement for candidates, whatever the tutor count
- [x] Returned shape feeds `passesHardFilters` directly
**Verify:** `npm run build`; exercised end-to-end by the T7 integration tests
**Depends on:** T1 · **Files:** `modules/matching/matching.repository.ts` · **Size:** S

- [x] **Commit** `feat(matching): add stage-1 hard filters and candidate query (TP-6)`

---

## Phase 2 — TP-7 Weighted scoring

### T3: Validated score + tutor-type modifier
**Description:** Validate 5/4 integer sliders in 1–5 for student and tutor (`BadRequestError`). Remove the `?? 3` fallback. Add `tutorTypePref` / `tutorType` params and `TUTOR_TYPE_MISMATCH_PENALTY` (clamp 0–100). Fix the misleading budget comment. Keep Manhattan distance and the 45/35/20 weights.
**Acceptance:**
- [x] Identical vectors → full style/personality points; max distance → 0; length 4/6 or value 0/6/2.5 → throws
- [x] Budget: rate < / = / > budget and rate 0; ANY and match unchanged; mismatch −penalty; clamp at 0
- [x] SPEC worked numbers A–E (95/90/80/70/80 cases) asserted; the same input called twice gives an identical result
**Verify:** `npm test --workspace=server`
**Depends on:** T0 · **Files:** `common/utils/scoring.util.ts`, `common/utils/scoring.util.test.ts` · **Size:** S

- [x] **Commit** `feat(matching): validate sliders and add tutor-type modifier to scoring (TP-7)`

### Checkpoint 1–2
- [ ] `npm run build && npm test` green · [ ] Human reviews constants (Q3, Q4, Q5) before the endpoint ships

---

## Phase 3 — TP-8 Top 3 ranking

### T4: Shared contract
**Description:** Trim `MatchRequestSchema` to `{ variant_id }`. Delete the unused `AvailabilitySlotSchema` / `AvailabilitySlotInput`. Add `MatchRequestStatus { PENDING, CONFIRMED }` and the DTOs `MatchResultDto`, `MatchRecommendationDto`, `PublicTutorCardDto`, `ConfirmSelectionResultDto`.
**Acceptance:**
- [x] Grep shows no remaining importers of the removed symbols
- [x] Schema rejects a missing or non-uuid `variant_id`
**Verify:** `npm run build:shared && npm run build`
**Depends on:** T2, T3 · **Files:** `packages/shared/src/schemas/matching.schema.ts`, `enums/index.ts`, `types/index.ts` · **Size:** S

### T5: *(only if Q2 = yes)* `match_requests.variant_id`
**Description:** Add a `variant_id` FK (NOT NULL) to `matchRequests`, then `npm run db:generate`, commit the SQL, `npm run db:migrate`.
**Acceptance:**
- [x] New migration file is committed; no `drizzle-kit push`
**Verify:** `npm run db:studio` → https://local.drizzle.studio: column type, FK to `subject_variants`
**Depends on:** T4 · **Files:** `db/schema/matching.schema.ts`, `db/migrations/*` · **Size:** XS

### T6: Ranking + `findTop3` service
**Description:** `rankTop3(scored)` sorts by rounded score desc, then `tutor_id` asc with `<`, slices 3, and assigns rank 1..n. `matchingService.findTop3(userId, { variant_id })` loads the profile (404 if missing), the variant (404 if unknown), checks for no slots (Q6: 422), then candidates → filter → score → rank → persist.
**Acceptance:**
- [x] Ties are ordered by `tutor_id`; 5 survivors → 3; 2 → 2; 0 → `[]` (request still persisted)
- [x] Service unit tests mock `studentsRepository` and `matchingRepository` (pattern: `tutors.service.test.ts`)
**Verify:** `npm test --workspace=server`
**Depends on:** T4 (T5) · **Files:** `common/utils/scoring.util.ts` (+test), `modules/matching/matching.service.ts`, `modules/matching/matching.service.test.ts` · **Size:** M

### T7: Route, persistence, integration, docs
**Description:** `router.post('/', authenticate, requireRole(['STUDENT']), validateRequest(MatchRequestSchema), runMatch)`. `matchingRepository.createRequestWithRecommendations` writes both tables in one tx. Add an integration test file, and an API_SPEC Module 6 section for `POST /api/matching`.
**Acceptance:**
- [x] 401 without token; 403 for TUTOR and ADMIN; 400 for `{}` and `{variant_id:'x'}`; 404 for an unknown variant; 200 shape per SPEC
- [x] Deep key scan finds no `phone_number`, `line_id`, `rejection_reason`, `file_key`; rows exist in both tables with matching rank and score
- [x] Works with `Bearer mock-token-<cognito_sub>`
**Verify:** `npm test --workspace=server`; sample curl from SPEC §4
**Depends on:** T6 · **Files:** `matching.routes.ts`, `matching.controller.ts`, `matching.repository.ts`, `matching.integration.test.ts`, `docs/API_SPEC.md` · **Size:** M

- [x] **Commit** `feat(matching): add POST /api/matching top-3 ranking (TP-8)`

### Checkpoint 3
- [ ] Build and tests green · [ ] curl returns ≤3 ranked tutors · [ ] (if T5) Drizzle Studio inspected by human

---

## Phase 4 — TP-9 Tutor selection

### T8: Transaction-aware notification creation
**Description:** Give `notificationRepository.create(data, executor = db)` and `notificationService.createNotification(params, executor?)` an optional executor. Existing callers are unchanged.
**Acceptance:**
- [ ] Grep shows all callers still compile; a call inside a rolled-back tx leaves no row
**Verify:** `npm run build && npm test --workspace=server`
**Depends on:** T7 · **Files:** `common/notifications/notification.repository.ts`, `notification.service.ts` · **Size:** XS

### T9: `confirmSelection` + route + docs
**Description:** `POST /:matchRequestId/confirm` (STUDENT, `ConfirmTutorSelectionSchema`). In one tx: lock the request `FOR UPDATE` → 404 (missing or not owner) → 409 (already CONFIRMED) → 404 (recommendation not in request) → 422 (`tutor_id` ≠ recommendation's tutor) → set CONFIRMED + `is_selected` → `TUTOR_SELECTED` notification with `requiresEmail: true` and the exact NOTIFICATIONS.md text. Add an API_SPEC section.
**Acceptance:**
- [ ] Unit tests for each error mapping (repos mocked); integration: 401/403/400/404/409/422, a malformed `:matchRequestId` gives 404 not 500
- [ ] Exactly one `is_selected = true`; one notification row with `requires_email = true`, `email_status = 'PENDING'`
- [ ] `Promise.all` of two confirms → statuses `{200, 409}`, still one selected row and one notification
**Verify:** `npm test --workspace=server`
**Depends on:** T8 · **Files:** `matching.service.ts` (+test), `matching.repository.ts`, `matching.routes.ts`, `matching.controller.ts`, `matching.integration.test.ts`, `docs/API_SPEC.md` · **Size:** M (6 files; docs edit is small)

- [ ] **Commit** `feat(matching): add tutor selection confirm with TUTOR_SELECTED notification (TP-9)`

### Checkpoint 4 — Done
- [ ] `npm run build:shared && npm run build && npm test` green
- [ ] Final report: commands, curl, "Docs are silent" list (mode, gender, penalty, min overlap, budget shape, no-slots status, zero-survivor persistence, null curriculum grades, variant_id), Drizzle Studio instruction if T5 ran
- [ ] Not pushed, no PR, Jira untouched
