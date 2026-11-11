# TutorPair cloud architecture alignment review

Reviewed 2026-10-22; deployment networking decision updated 2026-11-09. The authoritative component scope is now the user's replacement [Cloud Components table](./CLOUD_COMPONENTS.md), supplied directly in chat. It supersedes `TutorPair_Cloud.docx` and all embedded screenshots. Compared with PROJECT_CONTEXT.md, docs/ARCHITECTURE.md, the implementation guides, the repository inspected during this review, and AWS_SETUP_PLAN.md. Implementation findings below are the October snapshot and require rechecking against the current repository before release.

## Finding

The user accepted one codebase that supports HA, regular single-instance deployment, and an HA configuration for testing on 2026-10-22. [HIGH_AVAILABILITY.md](./HIGH_AVAILABILITY.md) records the shared code requirements and profile acceptance checks. Implementation and cloud failover verification remain pending; no HA achievement is claimed by this review.

The team's selected AWS services agree with the repository's intended architecture. Current code uses compatible foundations, but most product flows and deployment resources are incomplete. This is an implementation gap, not a need to replace the selected stack. No AWS account or deployed environment was inspected, so repository support must not be read as proof that a service is provisioned or working in AWS.

The replacement table defines the agreed services and their responsibilities. Prior screenshot-specific observations do not define project requirements. The original Word file is unchanged.

## Service comparison

Paths below are relative to the repository root. “Partial” means code exists but the full service integration has not been demonstrated.

| Team decision | Current evidence | Alignment and remaining work |
|---|---|---|
| Amplify Hosting for React | React/Vite client, Amplify initialization, and root `amplify.yml` | Build configuration is present for root workspace installation, shared/client builds, and client artifacts; hosting environment, SPA fallback behavior, and cloud preview remain to be verified. Auth SDK setup is not hosting setup. |
| Route 53 | Architecture docs describe frontend/API domains | Planned only in inspected repository. Configure hosted zone, domain records, and verification records; no deployed DNS was checked. |
| ALB and ACM | Port 4000; `/api/ready` database readiness and `/api/health` liveness in `apps/server/src/app.ts` | Configure the ALB IP target group's health check path as `/api/ready`; retain Docker/ECS container liveness at `/api/health`. Configure ALB, HTTPS listener, ACM certificate, and security groups. |
| ECS Fargate | Root multi-stage `Dockerfile` | Container foundation only. ECS task/service definitions, deployment configuration, and operational checks are absent from inspected files. Package migrations and exclude local secrets from build context. |
| ECR | Docker image build path exists | Planned only. Create repository, image retention/scanning policy, and authenticated image push/release workflow. |
| RDS PostgreSQL | `apps/server/src/db/client.ts`, Drizzle schemas and SQL migration | Compatible database implementation. Current defaults point to local PostgreSQL. Configure private RDS, encryption, trusted TLS, pool limits, backups, and cloud migration execution. |
| S3 images/documents | S3 client in `config/aws-clients.ts`; signed PUT/GET helpers in `common/utils/s3.util.ts` | Partial. Document routes/service and frontend upload flow are TODOs. Configure private bucket, browser CORS, IAM, quotas, object confirmation, authorization, and CV consent. |
| Cognito with Google OAuth 2.0 | JWT verifier, session interceptor, conditional Amplify pool configuration | Partial. `features/auth/LoginPage.tsx` uses mock login; auth sync routes are TODOs; Google federation and redirect configuration are missing. Preserve development mock auth while implementing real cloud login. |
| SES | SES SDK client and worker startup | Partial. `workers/email-dispatch.worker.ts` has a TODO instead of send logic. Configure sender identity and regional sending access; implement durable claiming, retries, and status updates. |
| CloudWatch | Console logs and health endpoint | Compatible logging source. Configure ECS `awslogs`, log group/retention, metrics/alarms, and alert destination. Console output alone is not a configured CloudWatch integration. |
| VPC and security groups | Agreed in project docs and replacement component table | Planned only in inspected repository. The 2026-11-09 decision places ECS tasks with public IPs in public subnets; keep ALB public and RDS private. Allow ALB → ECS:4000 and ECS → RDS:5432 through security group references. Do not allow internet-wide ingress to ECS:4000. |
| IAM | AWS SDK clients use the default credential provider chain | Compatible with task roles. Configure separate task execution, application, and deployment roles with resource-scoped permissions. No IAM policy definitions found. |
| Secrets Manager | Environment-driven database connection; Dockerfile contains no explicit credential values | Compatible injection approach, not completed integration. Configure task-definition secret injection and execution-role permission. Production validation must reject local/mock defaults. |

## Plan corrections made

The initial plan proposed private ECS and RDS. On 2026-11-09, the user selected public-subnet ECS with public IPs and ALB-only ingress for the short test; RDS remains private. This changes subnet placement and outbound cost, not the agreed service list. Specific subnet configuration is a deployment decision rather than a requirement inferred from the superseded screenshots.

The accepted regular deployment uses one public-subnet ECS task with a public IP and Single-AZ private RDS. The HA testing profile uses at least two public-subnet tasks with public IPs across two AZs and Multi-AZ private RDS. Each task uses its public-subnet route for outbound access; no NAT gateway is planned for ECS. Price task public IPv4 addresses, short log retention, and data transfer before provisioning. Both profiles must use the same application code with concurrency and recovery protections enabled. One task and Single-AZ RDS remain regular-profile availability compromises.

Region, database size, task CPU/memory, exact NAT/endpoint configuration, infrastructure tooling, and monthly cost remain deployment details to settle. Existing project requirements specify seven-day database backups in both profiles. The existing 99% availability target is unchanged. Do not present proposed sizing or unexecuted failure exercises as verified results.

## Implementation clarifications

The replacement component table defines service scope. The following are deployment considerations, not additional team-selected services:

- A standard regional ALB uses subnets in two AZs even when the demo has one API task. Two subnets do not imply two API tasks or Multi-AZ RDS.
- Public-subnet Fargate tasks need assigned public IPs and a default route to the internet gateway for required AWS APIs and Cognito signing keys. Restrict task ingress to the ALB security group; a public IP does not remove the need for backend authentication and authorization.
- S3 remains a regional managed service; browser uploads use authorized presigned URLs directly. A VPC endpoint must not prevent the intended browser access.
- Route 53 resolves frontend and API names. Browsers connect to Amplify or the ALB after DNS resolution.
- Cognito authentication, application authorization, document storage, and SES delivery remain separate responsibilities.
- The superseded screenshots create no AMI management, separate CloudFront distribution, or customer-managed KMS key requirement.

## Work order that preserves the agreement

1. Record the agreed service list, selected public ECS/private RDS boundary, test window, and total budget; prepare a Singapore cost estimate.
2. Prepare deployment basics: supported Node LTS, `.dockerignore`, strict production settings, packaged SQL migrations, RDS TLS, and actual test scripts.
3. Configure the selected AWS resources and deploy the HTTPS health endpoint with CloudWatch logs.
4. Complete Cognito sign-in, Google OAuth, and first-login database sync. Public sign-up may create STUDENT or TUTOR only; ADMIN provisioning must be privileged.
5. Complete private S3 uploads, document review, and consent checks; then profiles, deterministic matching, confirmed selection, and eligible reviews.
6. Complete SES notification dispatch and concurrency handling before task scaling or overlapping releases.
7. Demonstrate end-to-end flows, rollback, backup restore, role denial cases, and measured performance before describing the pilot as complete.

No source code, schemas, migrations, seed data, or AWS resources were changed in this reconciliation. Run `npm run build` and `npm test` when implementing the next changes; test scripts currently need to be added for `npm test` to execute real coverage. After future migrations or seeding, run `npm run db:studio` and inspect https://local.drizzle.studio through an authorized connection.

## AWS references used to resolve diagram details

- [AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html): container infrastructure management.
- [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html): managed hosting and CDN delivery.
- [Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html): subnet and AZ requirements.
- [VPC gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html): private VPC access to S3.
- [ECS outbound networking](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/networking-outbound.html): public and private subnet connectivity.
