# TutorPair availability and deployment decision

Accepted by the user on 2026-10-22. This document records implementation requirements and deployment intent. The required code changes and AWS failover tests are not yet complete.

## Decision and scope

Maintain one application codebase that operates correctly with either one or multiple API instances. Use a low-cost single-instance deployment for regular development and pilot use, and deploy an HA configuration for scheduled availability testing and demonstrations. Use the same application release in both profiles; infrastructure parameters and environment-specific settings select the deployment configuration.

The agreed [Cloud Components](./CLOUD_COMPONENTS.md) remain unchanged. Retain PostgreSQL-backed notification polling inside each API process, direct S3 presigned uploads, Cognito authentication, backend role enforcement, deterministic matching, and local development mock authentication. No Redis, SQS, separate worker service, or multi-region deployment is introduced by this decision.

HA testing initially covers task failures and Availability Zone failures within one AWS region. Regional disaster recovery requires a separate decision. The existing 99% availability target in PROJECT_CONTEXT.md is unchanged; the previously discussed 99.9% target has not been adopted. Set test recovery-time and data-loss acceptance limits before running cloud failure exercises.

## Deployment profiles

“Single-instance” means one API task and a Single-AZ database, not that every AWS component has only one underlying instance.

| Setting | Regular single-instance deployment | HA testing deployment |
|---|---|---|
| Application | Same release, supports concurrent instances | Same release, supports concurrent instances |
| API | One private Fargate task; desired/minimum count one | At least two private Fargate tasks across two AZs; desired/minimum count at least two |
| ALB | Public, across two AZ subnets | Public, across two AZ subnets; healthy targets in both AZs |
| PostgreSQL | Single-AZ RDS | RDS Multi-AZ DB instance with primary and standby in different AZs |
| Outbound path | Cost-controlled; one zonal NAT gateway is the current proposal | Must survive either AZ failing; for zonal NAT, one per AZ and AZ-local routing |
| Scaling | Fixed one task unless deliberately testing concurrency | Verify AZ distribution/rebalancing and surviving-task capacity before increasing traffic |
| Deployments | Health-checked replacement; temporary task overlap is possible | Keep healthy capacity during rolling releases; allow replacement capacity and automatic rollback |
| Availability claim | Can have downtime during task replacement or DB recovery | HA candidate; validate failure recovery before reporting measured results |

Private ECS and RDS remain the baseline. Public-subnet ECS is an unselected cost-saving alternative. NAT/endpoints, sizes, region, tooling, and monthly spending remain deployment details to finalize. Backups retain the existing seven-day requirement in both cloud profiles; Multi-AZ does not replace backups.

Maintain profiles as deployment configuration rather than separate application forks or incompatible database schemas. A separate paid environment is not mandatory. A temporary environment or a controlled change to the pilot may be used for HA testing; estimate charges and plan the change window first. Changing database availability settings can cause operational disruption. After testing, return to the regular profile deliberately, preserve data, and verify health and billing resources. Do not treat this document as authorization to provision, resize, fail over, or delete AWS resources now.

## Application requirements for both profiles

### State and concurrent requests

Persistent business state belongs in PostgreSQL and files belong in S3. Process memory and container disks must not be authoritative storage for sessions, uploads, match results, job ownership, or deduplication. Requests must work on any healthy API task without sticky sessions. Per-process JWT key caches are acceptable because they do not own business state.

Use database transactions and constraints to enforce the single tutor selection, review eligibility/uniqueness, and notification event identity. Repeated requests for the same completed operation must return a consistent result or a documented conflict without repeating its side effects. A concurrent check-then-insert without database protection is insufficient. Write the business change and its notification record atomically in the same transaction. Extend the shared schemas first if API contracts change.

### Notification worker safety

Run the same polling worker with one or several API processes. Claim a bounded batch atomically in PostgreSQL with recoverable ownership and an expiry; do not rely on a process-local flag to coordinate different workers. The exact lease fields, status transitions, and repository SQL must be designed during implementation and delivered through reviewed migrations.

Use a short claim transaction, then release database locks before calling SES. Only the current claim owner may finalize an attempt; protect against stale completion. Bound send timeouts and renew ownership or otherwise keep claims valid while sending. Stop overlapping polls within one process, retry transient failures with bounded backoff, and expose exhausted attempts for investigation. A crashed worker's claim must become eligible again without requiring another worker to have been present at startup. A single worker must continue operating normally.

Database event deduplication and claims prevent concurrent ordinary duplicate processing. They do not guarantee exactly-once SES delivery: SES may accept an email before the worker crashes or loses the response, leaving a retry ambiguous. Document that residual duplicate-delivery risk and do not claim that a database transaction can atomically commit an external email send. Keep email delivery asynchronous so SES outages do not fail an already committed tutor selection.

### Database failures and connections

Configure verified RDS TLS, explicit connection and query timeouts, pool error handling, and recovery using the database DNS endpoint. Bound pool sizes across maximum API count, temporary deployment tasks, workers, and migration jobs, leaving operational headroom. Discard broken connections and reconnect after failover.

Use bounded retries with backoff for transient failures only when safe. Do not blindly replay a write or a transaction after an uncertain commit. Resolve the operation using its durable identity or return a retriable error under a documented contract. Do not block server startup indefinitely while waiting for PostgreSQL.

### Health and shutdown

Provide separate process liveness and bounded database readiness checks. A shared database outage must not make every otherwise healthy process fail its liveness check and trigger a restart loop. Define ALB readiness thresholds and ECS startup grace periods deliberately; an ALB health signal alone does not prove business readiness or guarantee rejection of all traffic when all targets fail health checks. Request handlers must still fail clearly when dependencies are unavailable.

On SIGTERM, mark the process as draining, stop worker polling/new claims, drain active requests and bounded in-flight worker work, close the database pool, and exit within the configured ECS stop timeout. Align ALB draining with the shutdown budget and recover abandoned claims after forced termination.

### Releases and migrations

Run reviewed migrations once as a release job, not from every API task at startup. Use backward-compatible schema changes while old and new tasks overlap. Rolling back the image does not roll back schema changes. Configure health-checked deployments with rollback, retaining sufficient capacity and quota for temporary replacement tasks. Never disable worker safety or repeat-safe writes in the single-instance profile: deployments and client retries can overlap there too.

## Verification and evidence

Run `npm run build` and `npm test` from the repository root after implementation. Add real workspace test scripts first; the current root command can succeed without executing tests. Preserve scoring unit tests and API integration coverage. No new HA-specific test command exists yet.

| Test | Required evidence |
|---|---|
| One API process and worker | Normal request and email processing; no dependency on a second instance |
| Two API processes sharing PostgreSQL | Concurrent requests preserve selection/review constraints and create one intended notification event |
| Concurrent polling | A notification has only one valid active claim; separate processes do not send it concurrently under valid ownership |
| Worker crash and stale claim | Expired work is recoverable; stale owners cannot finalize another attempt; ambiguous SES outcomes are documented |
| Database interruption | Bounded failures and successful recovery; no unhandled pool errors or duplicated committed writes |
| SIGTERM under load | Requests drain within budget; polling stops; unfinished claims recover |
| Task failure behind ALB | Continuous probes record failed requests and recovery while another task remains available |
| Controlled RDS failover | Existing connections recover through the endpoint; report interruption duration and write outcomes |
| AZ dependency exercise | Verify surviving API capacity and outbound access; stopping one task alone does not prove AZ resilience |
| Unhealthy release | Healthy capacity retained and automatic rollback demonstrated |

Run failure exercises only in an approved test scope with reference/test data and explicit recovery limits. Record release/image, actual task placement, database mode, routes, timestamps, error counts, observed recovery, and any unresolved limits. Backups must also pass a separate restore rehearsal.

After future schema, migration, or seed changes, the human developer must run `npm run db:studio` and inspect https://local.drizzle.studio through an authorized connection. This documentation update does not modify schema or data.

## Reporting status

Distinguish these statements: “designed for multiple instances,” “verified with multiple processes,” “HA configuration deployed,” and “failover tested.” None implies the next. A regular single-instance deployment is not currently HA because an HA configuration exists in source control. Report measured outcomes and active topology rather than an untested availability guarantee.
