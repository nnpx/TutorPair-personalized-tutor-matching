# TutorPair cloud documentation

| Document | Purpose |
|---|---|
| [Cloud Components](./CLOUD_COMPONENTS.md) | Agreed AWS services and responsibilities |
| [Availability and Deployment Profiles](./HIGH_AVAILABILITY.md) | One codebase supporting HA, regular single-instance deployment, HA testing, and verification requirements |
| [AWS Setup Plan](./AWS_SETUP_PLAN.md) | Deployment sequence, networking, cost considerations, and readiness gaps |
| [AWS Alignment Review](./AWS_ALIGNMENT_REVIEW.md) | Comparison of agreed services with repository implementation status |
| [AWS Deployment Log](./AWS_DEPLOYMENT_LOG.md) | Actual resources created, observed settings, and pending verification |
| [Pilot migration task definition](./ecs-migration-task-definition.json) | One-off Fargate migration pinned to the scanned image digest; no secret values |
| [Pilot migration verification override](./ecs-migration-verify-overrides.json) | Read-only table, journal, and application grant check |
| [Pilot reference seed task definition](./ecs-reference-seed-task-definition.json) | One-off production reference subjects and variants seed; mock fixtures disabled |
| [Pilot reference seed verification override](./ecs-reference-seed-verify-overrides.json) | Read-only subject, variant, and mock-user counts |

Application integration guides remain in the [main documentation directory](../README.md), including [authentication](../AUTH_FLOW.md), [S3 documents](../S3_DOCUMENTS.md), [notifications](../NOTIFICATIONS.md), and [database migrations](../DATABASE.md).
