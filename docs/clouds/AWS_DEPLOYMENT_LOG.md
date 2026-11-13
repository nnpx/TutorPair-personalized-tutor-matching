# TutorPair AWS deployment log

This is a record of AWS setup performed by the human developer. It distinguishes settings visible in screenshots from choices shown before creation. Do not place credentials, secret values, or private document data here.

## 2026-11-09 — Pilot VPC created

**Performed by:** Human developer in the AWS console.  
**Region:** Asia Pacific (Singapore), `ap-southeast-1`.  
**Evidence:** Developer-provided screenshots of the Create VPC form and the resulting VPC details/resource map.

| Setting | Recorded value | Evidence |
|---|---|---|
| VPC name | `tutorpair-pilot-vpc` | Resulting VPC details |
| VPC ID | `vpc-09afdab2ced554af7` | Resulting VPC details |
| State | Available | Resulting VPC details |
| IPv4 CIDR | `10.0.0.0/16` | Resulting VPC details |
| IPv6 | None shown | Resulting VPC details |
| Tenancy | Default | Resulting VPC details |
| DNS hostnames | Enabled | Resulting VPC details |
| DNS resolution | Enabled | Resulting VPC details |
| Availability Zones | `ap-southeast-1a`, `ap-southeast-1b` | Resulting resource map |
| Public subnets | `tutorpair-pilot-subnet-public1-ap-southeast-1a`; `tutorpair-pilot-subnet-public2-ap-southeast-1b` | Resulting resource map |
| Private subnets | `tutorpair-pilot-subnet-private1-ap-southeast-1a`; `tutorpair-pilot-subnet-private2-ap-southeast-1b` | Resulting resource map |
| Route tables | Four shown: one public, two private, and the VPC main route table | Resulting resource map |
| Public route table | `tutorpair-pilot-rtb-public` (`rtb-05863c1cd57ac4e9b`); two explicit subnet associations | Route table details screenshot |
| Public routes | Active `0.0.0.0/0` to internet gateway `igw-0f8003208194eef6d`; active `10.0.0.0/16` local route | Public route table Routes screenshot |
| Private route table, AZ 1a | `tutorpair-pilot-rtb-private1-ap-southeast-1a` (`rtb-0a46a38ac9ef1b652`), associated with `tutorpair-pilot-subnet-private1-ap-southeast-1a` | Private route table screenshot |
| Private route table, AZ 1b | `tutorpair-pilot-rtb-private2-ap-southeast-1b` (`rtb-07809c54944008ba2`), associated with `tutorpair-pilot-subnet-private2-ap-southeast-1b` | Private route table screenshot |
| Private routes | Each table has only an active `10.0.0.0/16` local route; no internet gateway or NAT route | Both private Routes screenshots |
| NAT gateways | None selected | Create VPC form; verify after creation |
| VPC endpoints | Final setting unverified; `None` was recommended after the initial form showed `S3 Gateway` | Verify after creation |

The VPC was created for the planned public ALB and public-subnet ECS tasks, with RDS intended for the private subnets. No ALB, ECS service, database, or security group configuration is verified by this entry.

### Next verification

- Confirm the internet gateway is attached to this VPC; the active public route to it is verified.
- Confirm the account has no NAT gateway or VPC endpoint associated with this pilot VPC.
- Record subnet IDs when creating the RDS subnet group and ECS service.

## 2026-11-09 — ALB security group created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided security group creation confirmation/details screenshot.

| Setting | Recorded value | Evidence |
|---|---|---|
| Name | `tutorpair-pilot-alb-sg` | Security group details |
| ID | `sg-0b915083597584494` | Security group details |
| VPC | `vpc-09afdab2ced554af7` | Security group details |
| Description | Public load balancer for TutorPair pilot | Security group details |
| Inbound rules | HTTP/TCP 80 and HTTPS/TCP 443, each from `0.0.0.0/0` | ALB Inbound rules screenshot |
| Outbound rules | One Custom TCP rule, port 4000, destination `sg-08e70b827fdf44081` (ECS API security group) | Saved Outbound rules screenshot |

Attach this group only to the TutorPair public ALB. Configure the port 80 listener to redirect to HTTPS when creating the ALB.

## 2026-11-09 — ECS API security group created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided security group creation confirmation/details screenshot.

| Setting | Recorded value | Evidence |
|---|---|---|
| Name | `tutorpair-pilot-ecs-sg` | Security group details |
| ID | `sg-08e70b827fdf44081` | Security group details |
| VPC | `vpc-09afdab2ced554af7` | Security group details |
| Description | TutorPair API tasks behind ALB | Security group details |
| Inbound rules | One Custom TCP rule, port 4000, source `sg-0b915083597584494` (ALB security group) | ECS Inbound rules screenshot, including source prefix |
| Outbound rules | HTTPS/TCP 443 to `0.0.0.0/0`; PostgreSQL/TCP 5432 to `sg-067d5910809024455` (RDS security group) | Saved ECS Outbound rules screenshot |

The recorded security group rules provide the planned ALB → ECS:4000 and ECS → RDS:5432 paths. Actual service connectivity remains untested until deployment.

## 2026-11-09 — RDS PostgreSQL security group created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided security group creation confirmation/details screenshot.

| Setting | Recorded value | Evidence |
|---|---|---|
| Name | `tutorpair-pilot-rds-sg` | Security group details |
| ID | `sg-067d5910809024455` | Security group details |
| VPC | `vpc-09afdab2ced554af7` | Security group details |
| Description | PostgreSQL access from TutorPair API | Security group details |
| Inbound rules | One PostgreSQL/TCP 5432 rule from `sg-08e70b827fdf44081` (ECS security group) | RDS Inbound rules screenshot, including source prefix |
| Outbound rules | Zero entries | Security group details |

The ECS outbound TCP 5432 rule to this group was added and verified in the saved ECS Outbound rules screenshot.

## 2026-11-09 — RDS DB subnet group created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided subnet group creation confirmation/details screenshot.

| Setting | Recorded value | Evidence |
|---|---|---|
| Name | `tutorpair-pilot-db-subnets` | Subnet group details |
| VPC | `vpc-09afdab2ced554af7` | Subnet group details |
| Description | Private database subnets for TutorPair pilot | Subnet group details |
| Network type | IPv4 | Subnet group details |
| Private subnet, AZ 1a | `tutorpair-pilot-subnet-private1-ap-southeast-1a` (`subnet-0347fa26e8d1ca8c8`), `10.0.128.0/20` | Subnets table |
| Private subnet, AZ 1b | `tutorpair-pilot-subnet-private2-ap-southeast-1b` (`subnet-0facce04ab0d7ef07`), `10.0.144.0/20` | Subnets table |

The subnet group is ready for an RDS PostgreSQL DB instance. No database instance is verified as created by this entry.

## 2026-11-09 — RDS PostgreSQL pilot instance created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided creation confirmation and RDS instance summary screenshot, plus reviewed creation-form screenshots.

| Setting | Recorded value | Evidence |
|---|---|---|
| DB instance identifier | `tutorpair-pilot-db` | Creation confirmation and instance summary |
| Status at observation | Available | Instance summary |
| Region and AZ | `ap-southeast-1`, `ap-southeast-1a` | Instance summary |
| Engine and class | PostgreSQL, `db.t4g.small` | Instance summary |
| Engine version | PostgreSQL `16.15-R1` | Creation form; verify on created instance |
| Deployment profile | Single-AZ DB instance, one instance | Creation form; verify on created instance |
| Initial database | `tutorpair` | Created instance Endpoints panel; contents remain unverified |
| Master username | `tutorpairadmin` | Creation form |
| Master credentials | RDS-managed AWS Secrets Manager secret; secret value not recorded | Creation form and instance connection panel |
| Storage | 20 GiB gp3; storage autoscaling off | Creation form; verify on created instance |
| VPC and subnet group | `vpc-09afdab2ced554af7`, `tutorpair-pilot-db-subnets` with private subnets `subnet-0347fa26e8d1ca8c8` and `subnet-0facce04ab0d7ef07` | Created instance Networking panel |
| Endpoint and port | `tutorpair-pilot-db.cbk2ewumyiw9.ap-southeast-1.rds.amazonaws.com`:5432 | Created instance Connectivity & security panel |
| Public accessibility | No | Created instance Security panel |
| VPC security group | `tutorpair-pilot-rds-sg` (`sg-067d5910809024455`) attached; rule references ECS group `sg-08e70b827fdf44081` | Created instance Connectivity & security screenshot |
| Encryption | Enabled with AWS-managed `aws/rds` key | Creation form; verify on created instance |
| RDS certificate authority | `rds-ca-rsa2048-g1` | Created instance Security panel |
| Automated backups | Enabled, seven-day retention | Created instance Maintenance & backups tab |
| Backup evidence | One automated snapshot shown as Available on 2026-11-09; restore not tested | Created instance Maintenance & backups tab |
| Deletion protection | Enabled | Creation form; verify on created instance |

The database has not yet been reached by the TutorPair API, and no migrations or reference data are recorded as applied. The RDS-managed master secret is not the application's `DATABASE_URL` string; the runtime database user and application secret still need a deployment design.

The Connectivity & security panel also showed no automatically connected compute resources. ECS connectivity will be configured manually and is not yet deployed.
The Maintenance & backups tab showed auto minor version upgrades enabled and no pending maintenance at observation time. The next maintenance window falls on 2026-11-15, within the professor review period; check for newly pending maintenance before that date.

## 2026-11-09 — Private S3 document bucket created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided S3 creation success banner and empty bucket Objects tab, plus reviewed creation-form screenshots.

| Setting | Recorded value | Evidence |
|---|---|---|
| Bucket name | `tutorpair-pilot-documents-528301714999-ap-southeast-1-an` | Creation success banner and bucket heading |
| Region | Asia Pacific (Singapore), `ap-southeast-1` | Creation form |
| Bucket type and namespace | General purpose; Account Regional namespace | Creation form; verify in bucket details if displayed |
| Object ownership | ACLs disabled; Bucket owner enforced | Created bucket Permissions tab |
| Public access | Block all public access On | Created bucket Permissions tab |
| Bucket policy | `DenyInsecureTransport`: Deny `s3:*` for all principals on the bucket and its objects when `aws:SecureTransport` is `false` | Saved policy on created bucket Permissions tab |
| CORS configuration | None displayed | Created bucket Permissions tab |
| Versioning | Disabled | Created bucket Properties tab |
| Default encryption | SSE-S3 (Amazon S3 managed keys); Bucket Key enabled | Created bucket Properties tab |
| Blocked encryption type | SSE-C (customer-provided keys) | Created bucket Properties tab |
| Objects at creation | 0 | Created bucket Objects tab |

The bucket is intended for private tutor documents and profile photos through presigned URLs. Its public access block, object ownership, versioning, encryption, and TLS-only bucket policy were checked after creation. No CORS configuration, application IAM access, or upload/download test is recorded yet.

## 2026-11-09 — Cognito user pool and SPA application created

**Performed by:** Human developer in the AWS console.  
**Evidence:** Developer-provided creation form and Cognito success screen.

| Setting | Recorded value | Evidence |
|---|---|---|
| Application name | `tutorpair-pilot-spa` | Creation success banner |
| App client ID | `irch38183ksbnqcgabscq78oo` | Created app client information panel |
| App client secret | None shown | Created app client information panel |
| App client authentication flows | Choice-based sign-in; SRP; refresh from existing authenticated sessions | Created app client information panel |
| App client token lifetimes | Refresh 5 days; access 60 minutes; ID 60 minutes | Created app client information panel |
| App client advanced settings | Token revocation and prevent user existence errors enabled | Created app client information panel |
| User pool name | `tutorpair-pilot-users` (renamed from `User pool - gkhl1`) | Rename success banner and updated pool overview |
| User pool ID | `ap-southeast-1_sYIuVgJx5` | Created pool overview |
| User pool Region | Asia Pacific (Singapore), primary | Created pool overview |
| User pool feature plan | Essentials | Created pool overview |
| Users at observation | 0 | Created pool overview |
| Application type | Single-page application (SPA) selected | Creation form |
| Sign-in identifier | Email only | Created pool Sign-in page |
| Required sign-up attribute | Email only | Created pool Sign-up page |
| Self-registration | Disabled for initial pilot setup | Created pool Sign-up page |
| Attribute verification | Cognito-assisted automatic email messages; verify email address | Created pool Sign-up page |
| Custom attributes | None | Created pool Sign-up page |
| Verification email sender | Cognito email provider, `no-reply@verificationemail.com` | Created pool Authentication methods page |
| Password policy | Minimum 8 characters, with number, special character, uppercase and lowercase letters | Created pool Authentication methods page |
| Administrator-set temporary password expiry | 7 days | Created pool Authentication methods page |
| SMS | No sending role or origination identity shown; setup incomplete warning | Created pool Authentication methods page |
| Primary sign-in factor | Password; passwordless inactive | Created pool Sign-in page |
| MFA enforcement | Optional MFA; authenticator apps (TOTP) | MFA update success and saved Sign-in page; admin enrollment/enforcement remains pending |
| Device tracking | Do not remember devices | Created pool Sign-in page |
| Self-service account recovery | Enabled; Email only | Recovery update success and saved Sign-in page |
| Return URL | Left blank | Creation form; configure after frontend origin and callback route are determined |
| Managed login status | Available | Created app client Login pages tab |
| Cognito managed login domain | `https://ap-southeast-1syiuvgjx5.auth.ap-southeast-1.amazoncognito.com` | Created user pool Domain page |
| Cognito domain branding | Managed login | Created user pool Domain page |
| Cognito custom domain | None | Created user pool Domain page |
| Allowed callback URL | `http://localhost:5173/` for local development; replaced Cognito's auto-populated CloudFront URL | App client update success and saved Login pages tab |
| Allowed sign-out URLs | None | Created app client Login pages tab |
| Managed login identity provider | Cognito user pool directory only | Created app client Login pages tab |
| OAuth grant and scopes | Authorization code grant; `email` and `openid` scopes | Saved Login pages tab after removing `phone` |

Google federation is not configured for this app client. Add the real HTTPS frontend callback and sign-out URL when the hosted site exists; the local callback alone is not a deployment configuration. Admin MFA and the desired recovery method still need configuration. The console's quick setup code is sample guidance, not evidence that application code was changed or deployed.

### Google OAuth setup blocker observed

The developer attempted to choose **No organization** as the parent for a new Google Cloud project. Google Cloud displayed: `You do not have the required "resourcemanager.projects.create" permission to create projects in this location.` No Google Cloud project or OAuth client is confirmed as created. Check for an existing project with sufficient access before requesting project-creation permissions.

## 2026-11-09 — Google Cloud project created for Cognito federation

**Performed by:** Human developer in the Google Cloud console.  
**Evidence:** Developer-provided New Project form and resulting Google Cloud project home page.

| Setting | Recorded value | Evidence |
|---|---|---|
| Project name | `TutorPair Pilot Auth` | New Project form and project selector |
| Project ID | `tutorpair-pilot-auth` | Created project home page |
| Parent organization | `g.siit.tu.ac.th` (university) selected | New Project form; verify in project settings if needed |

The project exists, resolving the earlier project-creation permission blocker for the university organization. Google Auth Platform audience, OAuth client, redirect URIs, and Cognito Google provider remain unconfigured.

### Google Auth Platform OAuth app configured

The developer completed Google Auth Platform's initial App Information, Audience, Contact Information, and Finish steps. The resulting OAuth Overview is available for project `tutorpair-pilot-auth` and shows **no OAuth clients configured**. The saved Audience page confirms **External** user type and **Testing** publishing status, with no test users listed at observation time. The OAuth client, redirect URI, Google credentials, and Cognito Google provider remain pending. No contact email address is recorded here.

The created Branding page shows app name `TutorPair Pilot` and a university email selected for user support and developer notices (address intentionally omitted from this log). The saved Branding page shows `amazoncognito.com` as an authorized domain. No logo, homepage, privacy policy URL, or terms URL is shown as configured yet.

The saved Data Access page shows only the three basic identity scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, and `https://www.googleapis.com/auth/userinfo.profile`. The sensitive scopes section shown is empty. No other API scope was requested in the reviewed setup.

### Google OAuth client created

The developer selected **Web application** and Google Cloud displayed **OAuth client created**. The preceding form used the name `TutorPair Pilot Cognito Google`, Cognito domain `https://ap-southeast-1syiuvgjx5.auth.ap-southeast-1.amazoncognito.com` as the JavaScript origin, and its `/oauth2/idpresponse` endpoint as the redirect URI, as instructed; the creation screenshot does not show the saved client configuration, so those exact saved values remain to be verified. Google warned that the client secret will no longer be viewable or downloadable after closing the dialog. The secret is intentionally not recorded in this log. The dialog also stated that OAuth access is restricted to test users listed on the consent screen. Cognito Google provider configuration remains pending.

The subsequent Google Auth Platform Audience page confirms **External** audience in **Testing** status with **4 test users** listed. Their email addresses are intentionally omitted from this log.

### Cognito Google identity provider created

The Cognito **Identity provider: Google** details page confirms that Google is configured for user pool `tutorpair-pilot-users`. Authorized scopes are `profile email openid`. Attribute mappings are `email` ← Google `email`, `email_verified` ← Google `email_verified`, and `username` ← Google `sub`. The Google client secret is masked in the console and is intentionally not recorded here. Enabling this provider on the SPA app client and an end-to-end sign-in test remain pending.

### Google enabled on Cognito SPA app client

The saved `tutorpair-pilot-spa` app client page confirms both **Cognito user pool directory** and **Google** as identity providers. Managed login is available. The authorization code grant is enabled with `email` and `openid` OIDC scopes. Allowed callback URL, default redirect URL, and allowed sign-out URL are all `http://localhost:5173/` for local testing. A deployed HTTPS frontend URL and end-to-end Google sign-in verification remain pending.

The developer opened the Cognito managed login page for this app client and confirmed that **Sign in with Google** appears alongside email sign-in. A successful Google account redirect and Cognito federated user creation have not yet been confirmed.

### Google federation sign-in verified through Cognito

After choosing Google sign-in, the developer observed a browser **site can't be reached** page at the local app callback (the local frontend was not confirmed running). The Cognito Users page shows **1** `google_...` federated user with **Email verified: Yes**, **Confirmation status: External provider**, and **Status: Enabled**. This confirms that Google authentication reached Cognito and created the federated user. The frontend callback/token exchange and complete in-app session remain unverified.

## 2026-11-09 — SES sending domain identity created

**Performed by:** Human developer in the Amazon SES console.  
**Region:** Asia Pacific (Singapore), `ap-southeast-1`.  
**Evidence:** Developer-provided SES identity details screenshot.

| Setting | Recorded value | Evidence |
|---|---|---|
| Domain identity | `tutorpair.com` | SES identity details page |
| ARN | `arn:aws:ses:ap-southeast-1:528301714999:identity/tutorpair.com` | SES identity details page |
| Identity status | Verification pending | SES Summary |
| DKIM | Easy DKIM, RSA 2048-bit signing key, signatures enabled; configuration pending | SES Authentication tab |
| Custom MAIL FROM domain | Not started | SES Authentication tab |

The SES-generated DKIM DNS records still need to be published and detected before the identity can be used as a verified sender. SES sandbox status and production access have not yet been checked.

The Authentication tab's expanded **Publish DNS records** section shows three SES-generated Easy DKIM CNAME records for `tutorpair.com`. They have not yet been confirmed as published in the authoritative DNS zone. Use the console's copy controls or CSV export for the exact record names and values; they are not transcribed into this log.

## 2026-11-09 — Route 53 public hosted zone created

**Performed by:** Human developer in the Route 53 console.  
**Evidence:** Developer-provided success banner and new hosted-zone records screenshot.

The public hosted zone `tutorpair.com` was created and shows the default **NS** and **SOA** records (2 records total). A different pre-existing hosted zone, `siittrapp.arbw.dev`, was left untouched. The Route 53 name-server values are not fully visible in the screenshot and are not recorded. The SES DKIM CNAME records have not yet been confirmed as added to this zone, and registrar delegation to these Route 53 name servers has not yet been confirmed.

The subsequent Route 53 success banner confirms that the three SES Easy DKIM **CNAME** records were created in the `tutorpair.com` hosted zone. The zone now shows **5 records**: NS, SOA, and three CNAMEs. Registrar name-server delegation and public DNS propagation remain unverified, so SES verification may still be pending.

The hosted zone NS record shows these four assigned Route 53 name servers: `ns-1594.awsdns-07.co.uk`, `ns-12.awsdns-01.com`, `ns-610.awsdns-12.net`, and `ns-1527.awsdns-62.org` (shown with terminal dots in the DNS record). These values have not yet been confirmed as set at the domain registrar.

**Correction from developer:** Registration or ownership of `tutorpair.com` has not been completed. The hosted zone and its SES DKIM records therefore do not establish control of the public domain. Do not treat the SES identity as verified or proceed with registrar delegation until the developer has a domain they control and has decided where it will be registered.

The developer searched Route 53 domain registration for the exact name `tutorpair.com`; the result says **not available**. The `tutorpair.com` SES identity and hosted zone cannot be used for public verification unless the existing registrant grants domain/DNS control. Route 53 displayed possible alternative names, including `tutorpair.net`, `tutorpair.org`, and `tutor-pair.com`; none has been selected or registered. Once a domain is chosen and registered, create a matching SES identity and DKIM records in its authoritative DNS zone. The existing `tutorpair.com` hosted zone and SES identity should be reviewed for cleanup after the replacement works.

## 2026-11-10 — Domain purchase deferred

**Decision by:** Human developer. `tutor-pair.com` was considered but has **not** been registered. Defer domain purchase, authoritative DNS configuration, matching SES identity verification, and domain-dependent ACM/ALB HTTPS setup. Continue with independent application and AWS preparation first. Do not treat the existing `tutorpair.com` hosted zone or SES identity as usable for the pilot.

## 2026-11-10 — AWS Budgets setup deferred

**Decision by:** Human developer. Skip AWS Budgets setup in the professor-managed account for now. No budget or billing alert has been confirmed. Continue with cloud resources that do not depend on billing administration; the account owner or administrator can handle a budget alert later if appropriate.

## 2026-11-10 — Private ECR repository created

**Performed by:** Human developer in the Amazon ECR console.  
**Region:** Asia Pacific (Singapore), `ap-southeast-1`.  
**Evidence:** Developer-provided repository Images page screenshot.

The private repository `tutorpair-pilot-api` is present. Its Images tab shows **No active images**, so no backend image has been pushed yet. The Summary page confirms:

| Setting | Saved value |
|---|---|
| Repository URI | `528301714999.dkr.ecr.ap-southeast-1.amazonaws.com/tutorpair-pilot-api` |
| Repository ARN | `arn:aws:ecr:ap-southeast-1:528301714999:repository/tutorpair-pilot-api` |
| Tag mutability | Immutable; no exclusions |
| Encryption | AES-256 |
| Scan frequency | Manual |
| Lifecycle policy | Priority 1; any image; expire images beyond the 10 newest |
| Repository permission policy | None |
| AWS resource tags | None |

The Lifecycle policy tab later confirms a saved rule: priority `1`, description `Keep 10 newest images`, tag status `Any`, match criterion `Image limit: 10`, action `Expire`. The repository still had no images at the time this rule was created. Manual scanning can be run after an image is pushed.

## 2026-11-10 — Local API image verified before ECR push

**Performed by:** Codex in the local workspace; no image has been pushed to AWS yet.

Docker Desktop's Linux engine became available (server version `29.9.2`). `docker build --progress=plain -t tutorpair-server:17c88be -f Dockerfile .` completed successfully from the repository root. The tag uses the current source commit `17c88be`; the image includes the compiled server and SQL migrations.

The local TutorPair PostgreSQL container was started, and the committed migrations were applied to this fresh local database with `npm run db:migrate`. `npm test` then completed with **251 passed, 0 failed, 3 skipped**. A temporary container running the built image returned `status: ok` from `/api/health` and `status: ready, database: ok` from `/api/ready`; that API test container was stopped afterward. The local PostgreSQL container remains running for development. The human developer should run `npm run db:studio` and inspect `https://local.drizzle.studio` to visually verify the migrated tables and relations.

The ECR repository still needs an authenticated push and a manual image scan. The human developer installed AWS CLI v2, confirmed that `aws sts get-caller-identity --query Account --output text` returns account `528301714999`, and received `Login Succeeded` from `docker login` to the Singapore ECR registry. Docker Desktop's normal credential helper and Windows `wincred` both failed to save the token, so this successful login used a temporary `DOCKER_CONFIG` directory with file-based credential storage. That temporary file contains a short-lived ECR credential and should be removed after the image push. Domain/DNS/SES, ECS task and service, ALB/ACM, IAM roles for running the service, Secrets Manager injection, and public application flows are deployment or pilot-readiness work; they are not prerequisites to storing this validated image in ECR. Treat this as a baseline image until cloud integration and end-to-end pilot checks pass.

**Human visual check:** The developer opened `local.drizzle.studio` and shared a screenshot showing the migrated application tables in the `public` schema, including `users`, `students`, `tutors`, `subjects`, `documents`, `reviews`, and `availabilities`. The selected `availabilities` table shows its expected columns and a `user` relation. The visible tables show zero rows, consistent with a fresh local database before seed data is loaded. This screenshot does not establish that every table and relation has been individually inspected; no additional seed or schema change was made for this check.

## 2026-11-10 — API image pushed to ECR

**Performed by:** Human developer from Windows Command Prompt.  
**Region:** Asia Pacific (Singapore), `ap-southeast-1`.  
**Evidence:** Developer-provided `docker push` output ending with the image digest.

The local image was pushed to `528301714999.dkr.ecr.ap-southeast-1.amazonaws.com/tutorpair-pilot-api:17c88be`. Docker reported digest `sha256:0a5e87fe3f59d7309fd16d9ff39937304330cfd8eaeb4aa8f4b42110c966ddad` and `size: 856` for the manifest. This confirms that ECR accepted the image push. A manual vulnerability scan and review of its findings remain pending. The temporary Docker credential file used for ECR login should be removed after the push.

The attempted manual scan of tag `17c88be` failed with `UnsupportedImageTypeException`: ECR reports that the pushed artifact has media type `application/vnd.oci.image.index.v1+json`, which this scan operation cannot scan. The push remains successful; vulnerability scan results have not been obtained. The next step is to publish a single-platform image manifest under a new tag (the repository uses immutable tags), then scan that tag.

The developer rebuilt locally with `docker buildx build --platform linux/amd64 --provenance=false --sbom=false --load --progress=plain -t tutorpair-server:17c88be-amd64 -f Dockerfile .`. The build completed, exporting image manifest `sha256:22400036fe16925105d690b7827fe45103c44fe73e1f8dfe8eac40413e487a38`. The temporary `DOCKER_CONFIG` setting used for ECR login hid the Buildx plugin; clearing that setting restored Buildx for this build.

The developer pushed `528301714999.dkr.ecr.ap-southeast-1.amazonaws.com/tutorpair-pilot-api:17c88be-amd64`. Docker reported digest `sha256:22400036fe16925105d690b7827fe45103c44fe73e1f8dfe8eac40413e487a38` and `size: 2946`, matching the rebuilt manifest. `aws ecr describe-images` confirmed media type `application/vnd.oci.image.manifest.v1+json`. The ECR manual scan completed and reported **1 critical finding**. This image should not be treated as cleared for deployment.

The developer then retrieved the finding details: **CVE-2026-4738**, severity **CRITICAL**, CVSS 4.0 score **9.4**, package `zlib` version `1.3.2-r1`. Upstream zlib lists the fix in version 1.4, and Alpine's v3.23 `x86_64` package repository lists `zlib` `1.4-r0`. The repository Dockerfile now requires `zlib>=1.4-r0` in the production runner. The previous `17c88be-amd64` tag remains vulnerable and must not be used for deployment.

The developer rebuilt the updated Dockerfile locally as `tutorpair-server:17c88be-zlib14-amd64` with Buildx for `linux/amd64`, provenance and SBOM disabled, and a single-platform image loaded locally. The build completed with manifest digest `sha256:22467e477272aa3eccd3fac1d4fef3ba835a45643b5e634dedf47fddcd2bfa65`. The runner build step explicitly reported `Upgrading zlib (1.3.2-r1 -> 1.4-r0)`. A subsequent `apk info -v zlib` invocation displayed package description rather than version, so the build log is the current version evidence. The production `npm ci --omit=dev` step also reported 6 npm audit findings (2 moderate, 4 high); details remain to be reviewed before deployment.

The developer authenticated to ECR again using the temporary Docker credential configuration and pushed `528301714999.dkr.ecr.ap-southeast-1.amazonaws.com/tutorpair-pilot-api:17c88be-zlib14-amd64`. Docker reported digest `sha256:22467e477272aa3eccd3fac1d4fef3ba835a45643b5e634dedf47fddcd2bfa65` and size `3136`, matching the local manifest digest. The developer-provided `describe-image-scan-findings` output for this tag shows status `COMPLETE` and empty severity counts `{}`. The previous zlib critical finding is therefore absent from this ECR basic scan. This does not resolve the separate npm audit warning from the production install; its 4 high and 2 moderate findings still need review. The temporary Docker credential file still contains an unencrypted, short-lived ECR token and should be removed after ECR work is finished.

## 2026-11-10 — Production npm dependencies remediated locally

**Performed by:** Codex in the local repository. **Cloud status:** New image has not been pushed or scanned in ECR.

The developer's `npm audit --omit=dev` identified six findings: high severity findings involving `body-parser`, `follow-redirects`, and `zod`, plus two moderate React Router findings. Updated the lockfile for the available `body-parser` and `follow-redirects` fixes; upgraded Zod to `4.6.7`, `@asteasolutions/zod-to-openapi` to `8.5.0`, and React Router DOM to `7.18.5`. Adapted the shared auth schemas to Zod 4. The production Docker runner now installs only the `server` and `@tutorpair/shared` workspaces, in addition to requiring `zlib>=1.4-r0`.

Verification: `npm run build` succeeded for shared, server, and client. `npm test` passed with local PostgreSQL access: 251 passed, 0 failed, 3 skipped. `npm audit --omit=dev --json` returned zero production findings. A local `linux/amd64` single-manifest build with provenance and SBOM disabled succeeded as `tutorpair-server:17c88be-depsfix-amd64`, manifest digest `sha256:3c376aa781f3f8c49716a8b4952eb4df23c9d063c699992c9fbc118bf968a42c`. Container inspection confirmed `zlib-1.4-r0`, Zod `4.6.7`, and that `react-router-dom` is absent from the API image. The new image still requires an ECR push and completed ECR scan before it can replace the previous tag for deployment.

## 2026-11-10 — Remediated API image passed ECR scan

**Evidence:** Developer-provided AWS CLI `describe-image-scan-findings` output for `tutorpair-pilot-api:17c88be-depsfix-amd64` in `ap-southeast-1`.

ECR reports scan status `COMPLETE` with empty severity counts `{}` for this image tag. A subsequent developer-provided `aws ecr describe-images` response confirms remote digest `sha256:3c376aa781f3f8c49716a8b4952eb4df23c9d063c699992c9fbc118bf968a42c`, matching the local build, and media type `application/vnd.oci.image.manifest.v1+json`. This is the candidate image for the pilot API deployment. The older `17c88be-amd64` tag had a critical zlib finding and must not be used. Local `npm audit --omit=dev --json` reported zero production findings after the dependency update; the ECR scan result is a separate check. Domain, DNS, SES, and HTTPS-dependent steps remain deferred by the developer.

## 2026-11-10 — ECS cluster created

**Performed by:** Human developer in the Amazon ECS console.  
**Region:** Asia Pacific (Singapore), `ap-southeast-1`.  
**Evidence:** Developer-provided screenshot of the cluster Services page with a success banner.

Cluster `tutorpair-pilot-cluster` was created and shows status `Active`. CloudWatch monitoring is `Default`, and action logs are turned off. At the time of the screenshot, the cluster has zero services, zero running or pending tasks, and no registered container instances. The ECS task definition and service have not yet been created.

## 2026-11-10 — Existing ECS execution role inspected

**Evidence:** Developer-provided IAM Permissions and Trust relationships screenshots for `ecsTaskExecutionRole`.

The existing shared-account role trusts `ecs-tasks.amazonaws.com` and has the AWS-managed `AmazonECSTaskExecutionRolePolicy`. It also has `AmazonS3ReadOnlyAccess` and a customer inline policy named `AccessValkey`; the inline policy's contents were not inspected. To avoid changing or inheriting these unrelated permissions, the developer chose to create a dedicated TutorPair ECS task execution role. At this point, the new role had not yet been confirmed created.

## 2026-11-10 — Dedicated ECS task execution role created

**Performed by:** Human developer in the IAM console.  
**Evidence:** Developer-provided role Permissions and Trust relationships screenshots.

Role `tutorpair-pilot-ecs-execution-role` was created with ARN `arn:aws:iam::528301714999:role/tutorpair-pilot-ecs-execution-role`. Its Permissions tab shows one attached AWS-managed policy, `AmazonECSTaskExecutionRolePolicy`, with no additional attached policies visible. Its trust policy allows the `ecs-tasks.amazonaws.com` service principal to call `sts:AssumeRole`. The screenshot does not show any extra trust conditions. The role is ready to be selected as the ECS task definition's execution role for ECR image pulls and CloudWatch logging. Grant access to a specific Secrets Manager secret only after its ARN and injection design are set. The application task role, which will carry resource-scoped S3 and SES permissions, remains to be created.

## 2026-11-10 — Dedicated ECS application task role created

**Performed by:** Human developer in the IAM console.  
**Evidence:** Developer-provided role Permissions and Trust relationships screenshots.

Role `tutorpair-pilot-ecs-task-role` was created with ARN `arn:aws:iam::528301714999:role/tutorpair-pilot-ecs-task-role`. Its Permissions tab shows zero attached policies. Its trust policy allows the `ecs-tasks.amazonaws.com` service principal to call `sts:AssumeRole`; no additional conditions are visible. The role has no application AWS API permissions yet. The API document service was found to select real S3 only when static key environment variables were present. Local code was updated to use real S3 in production, where the AWS SDK can obtain ECS task role credentials, and to keep mock URLs in local development. The production image currently in ECR predates this fix and must be rebuilt, pushed under a new immutable tag, and scanned before deployment.

The mock S3 routes now return 404 in production. `npm run build:server` succeeded. The first `npm test` attempt was blocked from local PostgreSQL by sandbox `EACCES`; rerunning with local database access passed with 251 tests, 0 failures, and 3 skips. Actual S3 access through an ECS task role remains unverified until deployment.

## 2026-11-10 — Tutor document IAM policy created

**Performed by:** Human developer in the IAM console.  
**Evidence:** Developer-provided task role Permissions screenshot.

The `tutorpair-pilot-ecs-task-role` Permissions tab shows a success banner for `TutorPairPilotDocuments` and one customer inline policy with that name. The screenshot does not display the policy JSON, so its actual actions, resource ARN, and prefix remain unverified. No S3 operation has yet been tested using this role. SES access remains deferred while the sender domain and identity are unresolved.

The developer subsequently opened the policy JSON editor. It shows `Effect: Allow` with `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject`, and the editor reports zero errors and warnings. The `Resource` value is horizontally clipped after the beginning of the S3 ARN, so the full bucket name and `tutors/*` suffix remain unverified. No edit was confirmed saved from this editor view.

The developer then supplied the complete policy JSON. It confirms `Effect: Allow`, the three S3 actions above, and `Resource: arn:aws:s3:::tutorpair-pilot-documents-528301714999-ap-southeast-1-an/tutors/*`, matching the intended pilot bucket and tutor-document prefix. The policy contents are now verified from developer-provided text; live S3 access through the ECS role remains untested.

## 2026-11-10 — RDS master secret location confirmed

**Evidence:** Developer-provided RDS `tutorpair-pilot-db` Connectivity & security screenshot.

The instance is Available in `ap-southeast-1a`. The page shows a **Masters credentials ARN** linking to an RDS-managed Secrets Manager secret. Its connection example confirms database `tutorpair`, master user `tutorpairadmin`, and the previously recorded private endpoint on port 5432. The secret value was not viewed or shared. This is an administrative credential, not an application `DATABASE_URL`; do not grant the API task access to the master secret. A separate runtime database user and Secrets Manager application connection secret remain to be created before ECS secret injection can be configured.

## 2026-11-10 — ECS CloudWatch log group created

**Performed by:** Human developer in the CloudWatch console.  
**Evidence:** Developer-provided creation success and log group details screenshot.

The log group `/ecs/tutorpair-pilot-api` was created in `ap-southeast-1` with Standard class and one-week (7-day) retention. Its ARN is `arn:aws:logs:ap-southeast-1:528301714999:log-group:/ecs/tutorpair-pilot-api:*`. No KMS key ID or account retention policy is shown; deletion protection is Off. The Log streams tab shows zero streams, as expected before an ECS task runs. The future task definition must select this group with the `awslogs` driver; log delivery has not yet been tested.

## 2026-11-10 — Temporary database administration security group created

**Performed by:** Human developer in the VPC console.  
**Evidence:** Developer-provided security group creation success and details screenshot.

Security group `tutorpair-pilot-db-admin-sg` (`sg-0865c0b302d9594ba`) was created in VPC `vpc-09afdab2ced554af7`. The details show the intended temporary CloudShell database administration description, zero inbound rules, and one outbound rule. The outbound rule's protocol, port, and destination are not visible in this screenshot and remain to be checked. The RDS security group has not yet been confirmed to allow inbound TCP 5432 from this new group.

Subsequent developer-provided screenshots confirm the admin group's sole outbound rule is PostgreSQL/TCP 5432 to RDS group `sg-067d5910809024455`. The RDS group's inbound rules now contain two PostgreSQL/TCP 5432 sources: the existing ECS API group `sg-08e70b827fdf44081` and the new temporary admin group `sg-0865c0b302d9594ba`. The RDS group still shows zero outbound rules. Network reachability has not yet been tested from a CloudShell VPC environment.

## 2026-11-10 — CloudShell database administration environment opened

**Evidence:** Developer-provided CloudShell screenshot in Singapore (`ap-southeast-1`).

A CloudShell tab named `tutorpair-pilot-db-admin` with the VPC environment icon is open at a shell prompt. The screenshot does not display its subnet or attached security group, so those selections remain to be verified in environment details. PostgreSQL client availability and database connectivity have not yet been checked. No SQL has been run.

The developer then confirmed the environment details: VPC `vpc-09afdab2ced554af7`, private subnet `subnet-0347fa26e8d1ca8c8` (`10.0.128.0/20`), and security group `sg-0865c0b302d9594ba`. `psql --version` returned PostgreSQL client `16.15`. Network reachability and authentication remain untested; no SQL has been run.

The developer ran `pg_isready` from the CloudShell VPC environment against `tutorpair-pilot-db.cbk2ewumyiw9.ap-southeast-1.rds.amazonaws.com:5432` with database `tutorpair` and user `tutorpairadmin`; it returned **accepting connections**. This verifies a network path to the PostgreSQL listener, not database authentication or TLS identity. No password was shared and no SQL has been run.

The developer then connected with `psql` as `tutorpairadmin` to database `tutorpair` using `sslmode=require` and a hidden password prompt. The session reported PostgreSQL client `16.15` and an SSL connection using TLS 1.3 with `TLS_AES_256_GCM_SHA384`. This confirms authenticated encrypted access from CloudShell; `sslmode=require` does not verify the server certificate identity. The database password was not shared, and no SQL command has been reported yet.

## 2026-11-10 — Application PostgreSQL role created

**Performed by:** Human developer in the CloudShell VPC `psql` session.  
**Evidence:** Developer-provided command results.

`CREATE ROLE tutorpair_pilot_app LOGIN` succeeded. The developer set its password interactively with `\password`; the password was not shared or recorded. `GRANT CONNECT ON DATABASE tutorpair` and `GRANT USAGE ON SCHEMA public` both succeeded. Effective privileges have not yet been queried, no table or sequence permissions have been granted, and no migration has been run on RDS.

Subsequent read-only queries confirmed `tutorpair_pilot_app` can log in, cannot create databases or roles, and is not a superuser. It has database `CONNECT` and `public` schema `USAGE`, but no `public` schema `CREATE`. `pg_tables` reports zero tables in `public`. These checks do not establish table/sequence permissions because migrations have not yet created objects.

## 2026-11-10 — Migration PostgreSQL role created

**Performed by:** Human developer in the CloudShell VPC `psql` session.  
**Evidence:** Developer-provided command results.

`CREATE ROLE tutorpair_pilot_migrator LOGIN` succeeded, followed by an interactive `\password` assignment; the password was not shared or recorded. `GRANT CONNECT, CREATE ON DATABASE tutorpair` and `GRANT USAGE, CREATE ON SCHEMA public` both succeeded. These grants are intended to let Drizzle create its `drizzle` journal schema and application objects in `public`. Effective privileges and default grants to the runtime application role remain to be verified. No RDS migration has been run.

The developer-provided `\ddp` output confirms default privileges owned by `tutorpair_pilot_migrator` in `public`: future tables grant `arwd` (INSERT, SELECT, UPDATE, DELETE), sequences grant `rU` (SELECT, USAGE), and types grant `U` (USAGE) to `tutorpair_pilot_app`. These are future-object defaults; no RDS migration or table creation has been reported. During the switch from the admin connection to the migrator connection, two attempted shell commands were entered at a `psql` prompt and failed with syntax errors; they did not change the database. The successful `\ddp` ownership output indicates the default grants were made for the migrator role, though a separate `SELECT current_user` output was not provided.

The developer then ran a read-only privilege query in that session. It returned `current_user = tutorpair_pilot_migrator`, `can_create_schema = true` for database `tutorpair`, and `can_create_tables = true` for schema `public`. This confirms the migration role is active and has the expected effective CREATE privileges. No migration has been run.

## 2026-11-10 — API database connection secret created

**Evidence:** Developer-provided Secrets Manager details screenshot.

The Secrets Manager page shows secret name `tutorpair/pilot/api/database-url`, type **Other type of secret**, encryption key `aws/secretsmanager`, no resource permissions or replication displayed, and automatic rotation Disabled. The screenshot does not show the secret ARN or value. The value is intentionally not recorded; its exact format and successful connection have not yet been verified. The ECS task execution role does not yet have permission to read this secret.

A subsequent developer-provided success banner confirms the secret was stored. The details page shows ARN `arn:aws:secretsmanager:ap-southeast-1:528301714999:secret:tutorpair/pilot/api/database-url-DngwHK`, still with `aws/secretsmanager` encryption and the value hidden. The ECS execution role can now be scoped to this exact ARN for startup injection; no access policy or task definition injection has been verified yet.

## 2026-11-10 — API secret read policy created on ECS execution role

**Evidence:** Developer-provided IAM role Permissions screenshot with a policy creation success banner.

Role `tutorpair-pilot-ecs-execution-role` now shows two policies: the existing AWS-managed `AmazonECSTaskExecutionRolePolicy` and a new customer inline policy named `TutorPairPilotApiDatabaseSecret`. The screenshot confirms policy creation on the intended role, but not its saved JSON contents, so the exact `secretsmanager:GetSecretValue` action and secret ARN scope remain to be visually verified. ECS secret injection and live access have not yet been tested.

## 2026-11-10 — One-off migration image path prepared locally

**Performed by:** Codex in the local repository. **Cloud status:** No new image has been pushed or scanned.

The compiled migration entry point was decoupled from the API's full production environment validation. It now validates only its database URL, production RDS CA path, and pool size, so a one-off ECS migration task does not need frontend, Cognito, S3, or SES settings. The Dockerfile now downloads the public Singapore RDS CA bundle into the runner and sets `RDS_CA_BUNDLE` for both API and migration processes. The API still uses its existing strict production environment validation.

`npm run build` succeeded across shared, server, and client; `git diff --check` passed. The three focused migration configuration tests passed. A full `npm test` attempt could not reach local PostgreSQL because Docker Desktop's Linux engine was not running (`ECONNREFUSED` on localhost:5432). An attempt to start Docker Desktop from the session did not leave the engine running. The revised image has not yet been built, run, pushed, or scanned; RDS migrations remain unapplied.

## 2026-11-11 — Migration secret created and revised image verified locally

**Evidence:** Developer-provided Secrets Manager success/details screenshot; local build and test output. **Cloud status:** No new image has been pushed or scanned in ECR.

Secrets Manager confirms `tutorpair/pilot/migration/database-url` was stored in `ap-southeast-1` using `aws/secretsmanager`. Its ARN is `arn:aws:secretsmanager:ap-southeast-1:528301714999:secret:tutorpair/pilot/migration/database-url-UZuBOp`. The secret value stayed hidden and was not recorded; its exact format and RDS authentication remain unverified. No ECS execution role has yet been granted access to this migrator secret.

Docker Desktop's Linux engine became available again. The local `tutorpair-postgres` container was started, and `npm test` passed with **254 passed, 0 failed, 3 skipped**. A single-platform `linux/amd64` build with provenance and SBOM disabled completed as `tutorpair-server:17c88be-migration-ready-amd64`, image/manifest digest `sha256:71c1f3abe97bec7f3ac9924795d5a0420329007d3ddd2dbc7418192f29567010`. The build downloaded the Singapore RDS CA bundle, installed production dependencies with zero reported npm vulnerabilities, compiled shared/server code, and verified migration SQL and entry point files are present. Running `node apps/server/dist/db/migrate.js` from that image against the local development database completed successfully. This local execution is not an RDS migration; the revised image still needs a new immutable ECR push and scan before any ECS task uses it.

## 2026-11-11 — Dedicated migration ECS execution role created

**Evidence:** Developer-provided IAM role Permissions screenshot with an inline-policy creation success banner.

Role `tutorpair-pilot-ecs-migration-execution-role` was created with ARN `arn:aws:iam::528301714999:role/tutorpair-pilot-ecs-migration-execution-role`. Its Permissions tab shows `AmazonECSTaskExecutionRolePolicy` and customer inline policy `TutorPairPilotMigrationDatabaseSecret`. The screenshot does not show the trust relationship or saved inline policy JSON; those details and live secret injection remain unverified. The local AWS CLI was found, but its current login session had expired, so read-only CLI verification and ECR push cannot proceed until the developer reauthenticates.

The locally tested image was tagged for the private repository as `528301714999.dkr.ecr.ap-southeast-1.amazonaws.com/tutorpair-pilot-api:17c88be-migration-ready-amd64`. This is a local Docker tag only; no push or ECR scan has occurred.

## 2026-11-11 — Migration image pushed and scanned

**Performed by:** Codex using the developer's reauthenticated AWS CLI session. **Account:** `528301714999`; **Region:** `ap-southeast-1`.

The migration execution role's trust policy was verified to allow `ecs-tasks.amazonaws.com`. Its managed `AmazonECSTaskExecutionRolePolicy` and inline secret policy were confirmed. The saved inline policy name is actually `TutorPairPilotMigrationDatabaseSecre` (missing the final `t`); its JSON correctly grants `secretsmanager:GetSecretValue` for only `arn:aws:secretsmanager:ap-southeast-1:528301714999:secret:tutorpair/pilot/migration/database-url-UZuBOp`. The API execution role's inline policy was also verified to grant that action only for its own API database secret.

The image `17c88be-migration-ready-amd64` was pushed to the pilot ECR repository with a temporary Docker credential configuration that was removed after use. ECR confirmed digest `sha256:71c1f3abe97bec7f3ac9924795d5a0420329007d3ddd2dbc7418192f29567010` and a single-platform OCI image manifest. Its manual basic scan completed with no reported severity findings (`{}`). This scan result is limited to what ECR basic scanning detects.

## 2026-11-11 — Pilot RDS migrations applied and verified

**Performed by:** Codex using one-off ECS Fargate tasks in `tutorpair-pilot-cluster`. **Database:** private `tutorpair-pilot-db`.

RDS was verified Available with database `tutorpair`, seven-day backups, and `PubliclyAccessible=false`. The public ECS subnets have an active default route to internet gateway `igw-0f8003208194eef6d`; the ECS security group allows HTTPS outbound and PostgreSQL/TCP 5432 to the RDS group, which allows inbound 5432 from ECS. The tasks explicitly requested a public IP in public subnet `subnet-0d62a470014fdd6cc`; RDS remained private.

Task definition `tutorpair-pilot-db-migrate:1` used the immutable image digest, the dedicated migration execution role, the existing CloudWatch log group, and the migration secret ARN. Its first run (`30dcf0e8576c443c88381a34d1db770f`) exited 1 before database access because ECS injected the entire JSON secret object into `DATABASE_URL`. A format-only inspection, with the value and password never printed, established that the JSON key is `tutorpair/pilot/migration/database-url` and its value is a PostgreSQL URL for the migrator, correct RDS host, and database. AWS ECS supports extracting a JSON key by appending `:json-key::` to the ARN.

The checked-in [task definition](./ecs-migration-task-definition.json) was corrected to extract that key and registered as `tutorpair-pilot-db-migrate:2`. Its run (`4b394e4a7cd24141a4865089b7e14e37`) exited **0**. CloudWatch logged both “Running database migrations” and “Migrations completed successfully,” with no migration failure marker. A separate read-only task (`0061287d130a4c52b6236e93a6c5f030`) using the [verification override](./ecs-migration-verify-overrides.json) exited **0** and reported `publicTables=14`, `appliedMigrations=4`, and `appCanReadUsers=true`. This confirms the migration journal count and a sample runtime grant; full application behavior is not yet tested.

The superseded, failing task definition revision `tutorpair-pilot-db-migrate:1` was deregistered and is `INACTIVE`; revision 2 remains the usable version.

The API database secret is also a JSON object, keyed `tutorpair/pilot/api/database-url`, with a PostgreSQL URL value for `tutorpair_pilot_app` on the expected host/database. Its value and password were not printed. The future API task definition must extract that JSON key, not inject the whole secret object. API deployment remains blocked by unconfigured production HTTPS frontend origin, SES sender/domain, and related runtime settings. The human developer must run `npm run db:studio` through an authorized private database connection and inspect `https://local.drizzle.studio` to visually confirm tables, relations, and data, per repository instructions. No reference-data seed has been run.

## 2026-11-11 — Production reference subjects seeded

**Performed by:** Codex with one-off ECS Fargate task `d251331606e34a3a8c32be2c1b07fd2c`.

The existing seed entry point was adapted to use the same database-only configuration and verified RDS CA TLS path as the migration job. The seed source populates subjects and subject variants by lookup-before-insert; its mock tutor/student fixtures run only when `SEED_MOCK_USERS=true` and reject `NODE_ENV=production`. `npm run build --workspace=server` passed; `npm test` passed with 254 tests, 0 failures, and 3 skips when local PostgreSQL access was available. `npm run db:seed --workspace=server` succeeded against the confirmed local development database with mock fixtures disabled.

The new `linux/amd64` image was pushed as `17c88be-reference-seed-amd64` with digest `sha256:f9809288af59bab2287746bcbe8d99548d246be6a4568f50f1d70e146c24b652`; the temporary Docker ECR auth file was removed. ECR confirmed a single-platform OCI image manifest and a completed basic scan with no reported severity findings (`{}`). The [reference seed task definition](./ecs-reference-seed-task-definition.json) pins that digest, extracts the migrator URL JSON key, and sets `NODE_ENV=production` and `SEED_MOCK_USERS=false`.

The one-off seed task exited **0**. CloudWatch logged “Seeding reference subjects and variants” and “Reference subjects seeded; mock fixtures are opt-in,” with no failure marker. This confirms script completion; subject and variant row counts have not been independently queried, and the required human Drizzle Studio visual review remains pending. No mock users or reviews were requested for the pilot database.

## 2026-11-11 — Reference seed checked with read-only SQL

**Performed by:** Codex in AWS account `528301714999`, region `ap-southeast-1`. **Task:** `91f51f359e5b4d1097208b84e9965197` in `tutorpair-pilot-cluster`.

The [verification override](./ecs-reference-seed-verify-overrides.json) reused active migration task definition `tutorpair-pilot-db-migrate:2` solely for its private RDS access and migration execution role. Its command opened a `READ ONLY` transaction and ran counts; it did not run the migration or seed entry point. The task exited **0**. Its CloudWatch stream `migration/migrate/91f51f359e5b4d1097208b84e9965197` reported **24 subjects**, **67 subject variants**, **0 users**, and **0 users matching the mock fixture identifiers**. The zero total user count confirms no mock users are present at the time of this check. No secret value was printed or recorded.

The human developer still needs to connect to the private RDS database through an authorized private path, run `npm run db:studio`, and inspect `https://local.drizzle.studio` for tables, relations, and reference rows. Do not expose RDS publicly for this check.

The human developer independently ran a `BEGIN READ ONLY` transaction with `psql` from the existing CloudShell VPC database administration environment. The reported results matched the ECS check: **24 subjects**, **67 variants**, **0 users**, and **0 mock users**, followed by `COMMIT`. This confirms the counts through a second private connection. Drizzle Studio visual inspection remains pending.

## 2026-11-11 — Remaining API deployment dependencies checked

**Performed by:** Codex with read-only AWS CLI queries in account `528301714999`, region `ap-southeast-1` unless noted.

- Amplify has two unrelated apps (`playloop` and `scfrms-liff-app`); no TutorPair app or HTTPS frontend origin is configured.
- ECS cluster `tutorpair-pilot-cluster` has no services. The region has no load balancer and no ACM certificate. No public HTTPS API endpoint exists yet.
- Cognito user pool `tutorpair-pilot-users` (`ap-southeast-1_sYIuVgJx5`) still exists. The earlier recorded SPA client callback points to localhost; a deployed frontend callback and end-to-end browser login remain pending.
- SES sending is enabled, but `ProductionAccessEnabled=false` (sandbox). The `tutorpair.com` domain identity is still `PENDING`. Two individual email identities, `manager.des424@gmail.com` and `tech.plumber.des424@gmail.com`, show `SUCCESS`; either would require an explicit sender choice and sandbox recipient constraints for an SES pilot. No email delivery was attempted.
- Route 53 still lists the public `tutorpair.com` hosted zone. Its presence does not establish ownership or usable DNS. The earlier decision to defer buying `tutor-pair.com` remains in effect. No domain or DNS change was made.

The API task definition needs the **app** database secret with JSON-key extraction and `tutorpair-pilot-ecs-execution-role`; it must not use the migrator secret or migration execution role. Runtime `ALLOWED_ORIGIN` and `TUTOR_PORTAL_URL` require a real HTTPS frontend URL; `SES_FROM_EMAIL` must be a verified sender with `EMAIL_MODE=ses`. The frontend origin, HTTPS API hostname/certificate, Cognito production callback, S3 CORS origin, and SES sender strategy remain to be decided and configured before a working pilot release. No API service was started during this check.

## 2026-11-11 — Independent AWS settings verified; Studio review deferred

**Decision by:** Human developer. Continue AWS setup without completing the Drizzle Studio visual review now. The ECS and CloudShell read-only queries already verified the reference-data counts; the mandatory human visual inspection remains pending and must not be recorded as complete.

Read-only AWS checks confirmed the Cognito SPA client `irch38183ksbnqcgabscq78oo` still has only `http://localhost:5173/` as callback and logout URLs, with Cognito and Google providers enabled and authorization-code flow configured. The private document bucket's four public-access-block flags are all enabled. Default bucket encryption is SSE-S3 (`AES256`), and SSE-C is blocked. The saved ECS application task-role policy grants `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` only on the bucket's `tutors/*` prefix. The bucket currently has no CORS configuration. An actual HTTPS frontend origin is needed before setting browser CORS and deployed Cognito callbacks; no such settings were changed.

## 2026-11-11 — Domain purchase declined

**Decision by:** Human developer. Do not purchase a custom domain for this pilot. The previously considered `tutor-pair.com` is not being registered. The existing `tutorpair.com` hosted zone and pending SES identity remain unusable as proof of ownership. Continue with AWS-provided hostnames where possible; any domainless public API route must be explicitly designed and cost-checked before deployment. No registration or DNS change was made.

The developer subsequently deleted the unused public `tutorpair.com` Route 53 hosted zone. A read-only Route 53 query confirmed it is absent; the unrelated public `siitrrapp.arbw.dev` and private `motormate.local` zones remain. The `tutorpair.com` SES identity still exists in `PENDING` status and is not usable for sending. No new hosted zone was created.

Frontend deployment readiness was checked before creating an Amplify app. The repository has an `amplify.yml` monorepo build specification, but `LoginPage.tsx` still constructs `mock-token-...` for its Google button, and the frontend API client defaults to `http://localhost:4000` without `VITE_API_BASE_URL`. Thus an Amplify build alone would not provide a functional cloud login or browser API flow. Complete production Cognito login and a browser-valid HTTPS API route before describing the hosted app as usable.

## 2026-11-11 — Local Cognito and Amplify frontend integration implemented

**Performed by:** Codex in the local repository. **AWS status:** No AWS resource or Cognito setting was changed. This entry records code changes only; it does not claim deployment or end-to-end cloud verification.

The frontend now configures Amplify Auth from public `VITE_AWS_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_DOMAIN` values and uses Cognito's Google authorization-code redirect. The `/login` callback syncs the selected `STUDENT` or `TUTOR` role through `/api/auth/sync`; startup restores a Cognito session through `/api/auth/me`. Hosted API requests require HTTPS `VITE_API_BASE_URL` and a refreshed Cognito ID token; the production client cannot use its local URL or stored mock credentials. Local mock login remains a development-only flow. Backend sync uses Cognito JWT verification, preserves the first database role, rejects public `ADMIN` registration, and safely resolves concurrent insert races using existing unique constraints.

The Cognito pool `ap-southeast-1_sYIuVgJx5` and SPA client `irch38183ksbnqcgabscq78oo` are the configured pilot identifiers. Amplify Hosting has not assigned a TutorPair HTTPS hostname, no HTTPS API URL exists, and Google login has not been tested end-to-end. After Amplify assigns its HTTPS hostname, set both Cognito callback and logout URLs to `https://<assigned-amplify-hostname>/login` (replace the placeholder with the actual assigned hostname). Set Amplify build variables `VITE_API_BASE_URL` (actual HTTPS API origin), `VITE_AWS_REGION=ap-southeast-1`, `VITE_COGNITO_USER_POOL_ID=ap-southeast-1_sYIuVgJx5`, `VITE_COGNITO_CLIENT_ID=irch38183ksbnqcgabscq78oo`, and `VITE_COGNITO_DOMAIN` (the configured Cognito managed login domain hostname without scheme). Do not enter a client secret. The actual Amplify hostname, API origin, and Cognito domain value remain pending; callback/logout settings must not be changed until the hostname exists.

The private pilot database already contains migrations and reference data; no migration or seed was run for this work. Local automated test/build outcomes are recorded in the task report after verification. AWS deployment and browser verification remain pending.

A subsequent read-only ECR check found that the newest pilot repository image is still the pre-auth reference-seed image `sha256:f9809288af59bab2287746bcbe8d99548d246be6a4568f50f1d70e146c24b652`. The Cognito/API code changes therefore need a new tested, pushed, scanned immutable API image before ECS deployment. The pilot cluster is active. Both public subnets have `MapPublicIpOnLaunch=false`, so ECS service network configuration must explicitly set `assignPublicIp=ENABLED` for the selected public-subnet layout.

## 2026-11-11 — API target group created

**Performed by:** Human developer in the AWS console. **Evidence:** Developer-provided review and success screenshots.

Target group `tutorpair-pilot-api-tg` was created in `ap-southeast-1` with ARN `arn:aws:elasticloadbalancing:ap-southeast-1:528301714999:targetgroup/tutorpair-pilot-api-tg/911e281600473417`. It uses IP/IPv4 targets, HTTP port 4000, HTTP1, and pilot VPC `vpc-09afdab2ced554af7`. The review screen showed HTTP health checks on `/api/ready`, traffic-port, 30-second interval, 5-second timeout, healthy threshold 5, unhealthy threshold 2, and success code 200. The details screen shows creation success, no load balancer associated, and zero registered targets, which is expected before an ECS service is attached. No ALB was created by this step.

## 2026-11-11 — Pilot cost estimate prepared without calculator entry

**Performed by:** Codex using read-only AWS resource, Cost Explorer, and AWS Pricing API queries. The developer chose not to enter each resource in the interactive calculator. This is a planning estimate, not an AWS bill or a saved calculator estimate.

Live RDS configuration is `db.t4g.small`, Single-AZ, 20 GiB gp3, seven-day backup retention, and private access. No ECS service exists. For a conservative **216 hours** (nine full days through 19 November), one Linux/x86 Fargate API task at 0.5 vCPU/1 GiB, one ALB, up to one ALB LCU, and three public IPv4 addresses (two ALB, one ECS task), current Singapore AWS list rates yield:

| Item | Rate and assumption | Nine-day estimate |
|---|---|---:|
| RDS compute | $0.051/hour | $11.02 |
| RDS 20 GiB gp3 storage | $0.138/GiB-month, 9/30 month | $0.83 |
| ALB base | $0.0252/hour | $5.44 |
| ALB capacity | Up to 1 LCU at $0.008/hour | $1.73 |
| ECS Fargate | 0.5 × $0.05056/vCPU-hour + 1 × $0.00553/GB-hour | $6.66 |
| Public IPv4 | 3 × $0.005/hour | $3.24 |
| **Fixed/assumed subtotal** | | **$28.92** |

The subtotal excludes CloudFront requests/transfer, Amplify builds/hosting, S3, logs, SES, Secrets Manager, backup overage, taxes, RDS CPU credit overage, deployment overlap, and resources retained after 19 November. Those require measured use or explicit allowance; a rough **$10–$20** variable reserve would put a light-traffic planning range near **$39–$49**, not a cap. CloudFront may have free allowances, but this shared account's eligibility and other usage have not been attributed to TutorPair. The ALB and API ECS service are not yet running, so their projected charges have not started.

Cost Explorer returned **$240.35 USD** for 1–11 November across selected services in the *entire shared account*. It does not identify TutorPair resources and must not be treated as TutorPair spend or remaining pilot budget. The agreed ฿4,000 cap cannot be certified from this unallocated account-wide number. No paid resource was created during this estimate.

Pricing sources: [AWS ALB](https://aws.amazon.com/elasticloadbalancing/pricing/), [AWS Fargate](https://aws.amazon.com/fargate/pricing/), [AWS RDS](https://aws.amazon.com/rds/postgresql/pricing/), [AWS public IPv4](https://aws.amazon.com/vpc/pricing/), and [AWS CloudFront](https://aws.amazon.com/cloudfront/pricing/). The unit rates above were retrieved from AWS Pricing API for `ap-southeast-1` on 11 November 2026.

## 2026-11-11 — Post-auth API image built locally

**Performed by:** Human developer from the current working tree. **Cloud status:** Not pushed to ECR.

`docker build --platform linux/amd64 --provenance=false --sbom=false -t tutorpair-server:pilot-auth-20261111 -f Dockerfile .` completed successfully. Docker image inspection reported `linux/amd64` and local image ID `sha256:3ba1d4a1d2c634c6c66d0997e2845f55c3afbcf5e88bbb72bf13f8f445e92f1c`. The build included shared/server compilation and migration SQL/entry-point checks. This image contains the current local working tree, including uncommitted auth changes; it is not yet an ECR image, has not been scanned, and has not been run as the pilot API.

The developer tagged the image for pilot ECR. Two `docker login` attempts failed when Docker's Windows credential helper returned `The stub received bad data`, including one attempt with a fresh temporary `DOCKER_CONFIG` directory. Codex then used a short-lived AWS ECR authorization token in a separate temporary file-based Docker config to push the already tagged image; the temporary credential directory was removed in a `finally` block after the push. No token or secret value was printed or recorded.

ECR tag `pilot-auth-20261111-amd64` now has immutable digest `sha256:3ba1d4a1d2c634c6c66d0997e2845f55c3afbcf5e88bbb72bf13f8f445e92f1c` and a single-platform OCI image manifest. A manually started ECR basic scan completed with no reported severity findings (`{}`). This scan only covers findings detected by ECR basic scanning. No ECS API task or service was started.

## 2026-11-11 — Pilot API load balancer created

**Performed by:** Human developer in the EC2 console. **Evidence:** Developer-provided review and success screenshots, followed by read-only AWS CLI verification.

Application Load Balancer `tutorpair-pilot-api-alb` has ARN `arn:aws:elasticloadbalancing:ap-southeast-1:528301714999:loadbalancer/app/tutorpair-pilot-api-alb/5b8b7091cbcb92a6` and DNS name `tutorpair-pilot-api-alb-1963567001.ap-southeast-1.elb.amazonaws.com`. It is internet-facing, IPv4, in VPC `vpc-09afdab2ced554af7`, across public subnets `subnet-0d62a470014fdd6cc` and `subnet-0200e4aade29adfb1`, with only `tutorpair-pilot-alb-sg` (`sg-0b915083597584494`). The single HTTP:80 listener forwards 100% to `tutorpair-pilot-api-tg` with stickiness off. Optional automatic CloudFront/WAF, WAF, and Global Accelerator integrations were left off. An AWS CLI waiter subsequently confirmed the ALB reached `active`; no ECS targets are registered yet. This ALB has started accruing hourly and public IPv4 charges. Its AWS-generated DNS name is not a browser-valid HTTPS API URL by itself.

The CloudFront creation walkthrough reached the custom origin settings but did **not** create a distribution. A security review found that the proposed Free-plan CloudFront → public ALB HTTP path would carry authenticated API traffic over an unencrypted origin hop. AWS's CloudFront flat-rate feature matrix also reserves VPC origins for Business/Premium plans; the Free plan cannot provide the proposed private-origin alternative. Do not deploy the API through that HTTP public origin. A domain-free secure path needs a revised design, such as pay-as-you-go CloudFront with a VPC origin and internal ALB, before continuing the wizard. The public ALB remains active and chargeable until explicitly removed or replaced.

The developer returned to the CloudFront plan selector and selected pay-as-you-go; no distribution was created. Read-only checks confirmed the public ALB's target group had zero registered targets and the ECS cluster had zero services. Codex then deleted the unused public ALB, and the AWS waiter confirmed deletion. Its target group `tutorpair-pilot-api-tg`, private RDS database, ECR image, and ECS cluster were not deleted. An internal ALB in private subnets is now needed for the pay-as-you-go CloudFront VPC origin. The deletion stops future ALB hourly and associated public IPv4 charges after AWS completes cleanup.

## 2026-11-11 — Internal pilot API load balancer created

**Performed by:** Human developer in the EC2 console. **Evidence:** Developer-provided creation and details screenshots; no independent AWS CLI check is recorded for this ALB.

Application Load Balancer `tutorpair-pilot-api-int-alb` has ARN `arn:aws:elasticloadbalancing:ap-southeast-1:528301714999:loadbalancer/app/tutorpair-pilot-api-int-alb/80d5b46aec16cc39` and DNS name `internal-tutorpair-pilot-api-int-alb-1225202462.ap-southeast-1.elb.amazonaws.com`. The details screen shows **Internal** scheme, IPv4, pilot VPC `vpc-09afdab2ced554af7`, and private subnets `subnet-0347fa26e8d1ca8c8` (ap-southeast-1a) and `subnet-0facce04ab0d7ef07` (ap-southeast-1b). Its single HTTP:80 listener forwards 100% to `tutorpair-pilot-api-tg`, with target group stickiness off. The first screenshot showed `Provisioning`; the subsequent screenshot showed **Active**. The attached security group, registered target health, and CloudFront VPC origin have not yet been verified in these screenshots. ALB hourly charges began at creation; the internal ALB does not have public IPv4 addresses.


## 2026-11-11 — Internal ALB configuration rechecked in console

**Evidence:** Human-provided AWS console screenshot. The ALB details panel showed `tutorpair-pilot-api-int-alb` **Active**, **Internal**, IPv4, in VPC `vpc-09afdab2ced554af7`, with subnets `subnet-0347fa26e8d1ca8c8` (ap-southeast-1a) and `subnet-0facce04ab0d7ef07` (ap-southeast-1b). The listener panel showed one HTTP:80 listener forwarding 100% to `tutorpair-pilot-api-tg`, with target-group stickiness off. This confirms the reported ALB scheme, VPC, subnet placement, state, listener, and forwarding from the screenshot. The security tab/rules and target health remain unverified. A read-only AWS CLI verification attempt from Codex could not reach the AWS sign-in endpoint and returned no resource data; no CLI verification is claimed. No AWS setting was changed during this check.
The Security tab subsequently showed the internal ALB attached to `sg-0b915083597584494`, with two inbound permission entries and one outbound entry. The actual inbound protocols, ports, and source ranges were not visible in that screenshot and remain to be checked before tightening access.
The security group's inbound-rule screenshot showed `sg-0b915083597584494` allows TCP 80 (HTTP) and TCP 443 (HTTPS), both from `0.0.0.0/0`. The ALB is internal, so this is broad access from networks with a route to its private addresses, not a public ALB endpoint. The ALB has only an HTTP:80 listener. After CloudFront creates its VPC-origin managed security group, restrict ALB ingress to the CloudFront source on port 80 and remove unused port 443. No security-group rule was changed yet.

## 2026-11-11 — CloudFront VPC origin created

**Performed by:** Human developer in the CloudFront console. **Evidence:** Developer-provided VPC origin details screenshot.

VPC origin `tutorpair-pilot-api-vpc-origin` was created in account `528301714999` with ID `vo_lhlEZUzGE76B4KIHibYWs8` and ARN `arn:aws:cloudfront::528301714999:vpcorigin/vo_lhlEZUzGE76B4KIHibYWs8`. Its settings show IPv4, origin ARN `arn:aws:elasticloadbalancing:ap-southeast-1:528301714999:loadbalancer/app/tutorpair-pilot-api-int-alb/80d5b46aec16cc39`, `http-only` protocol policy, and HTTP port 80. The screenshot showed status **Deploying** and zero associated distributions. Wait for **Deployed** before creating the distribution or restricting the ALB security group to the CloudFront-managed source. No CloudFront browser hostname exists yet.
The human developer subsequently reported that the VPC origin reached **Deployed**. This status was reported in chat; no new console screenshot or independent CLI result was available. The origin has not yet been associated with a distribution.
The human developer saved the internal ALB security-group change. The success screenshot showed `sg-0b915083597584494` now has one inbound permission: HTTP/TCP 80 sourced from security group `sg-050ef93b36cb160f1` (the source link was visually truncated in the table). The former HTTPS/TCP 443 rule and broad IPv4 sources are absent from the visible rules. The source security group's managed name has not yet been independently verified from its details page. Outbound rules count remains one. No ECS service or CloudFront distribution is shown by this screenshot.
A follow-up screenshot opened the referenced source group and confirmed `sg-050ef93b36cb160f1` is the AWS-managed `CloudFront-VPCOrigins-Service-SG` in VPC `vpc-09afdab2ced554af7`, account `528301714999`. Thus the internal ALB's sole inbound HTTP:80 rule is restricted to CloudFront's VPC-origin service-managed group. The managed group itself was not edited.

## 2026-11-11 — Pilot API CloudFront distribution created

**Performed by:** Human developer in the CloudFront console. **Evidence:** Developer-provided wizard review and post-creation details screenshots. No successful read-only AWS CLI verification is claimed.

Standard distribution `tutorpair-pilot-api` was created on the **pay-as-you-go** billing option, with ID `E34GZDTZ2HCOR1`, ARN `arn:aws:cloudfront::528301714999:distribution/E34GZDTZ2HCOR1`, and assigned domain `d2vk9dqgas2wkp.cloudfront.net`. The success screen showed **Deploying**, not yet Deployed. No alternate domain name or default root object was configured. Standard and cookie logging were Off; the visible price class was **Use all edge locations**. The console's `$0/month` pay-as-you-go label is not a spending cap; CloudFront usage and the selected WAF configuration can incur charges.

The wizard review showed VPC origin `vo_lhlEZUzGE76B4KIHibYWs8`, blank origin path, no Origin Shield, HTTPS-only viewers, all seven HTTP methods (`GET`, `HEAD`, `OPTIONS`, `PUT`, `POST`, `PATCH`, `DELETE`), managed `CachingDisabled` cache policy, managed `AllViewer` origin request policy, no response headers policy, and WAF security protections Enabled with monitor mode Off. The preceding settings screenshot showed `OPTIONS` caching and gRPC disabled. The wizard displayed `Grant CloudFront access to origin: No`; the separate, already-verified internal ALB ingress rule allows HTTP:80 only from the AWS-managed CloudFront VPC-origin service security group. The VPC origin itself uses HTTP:80 over the private CloudFront-to-VPC path.

Wait for distribution status **Deployed**, then inspect its Origins, Behaviors, and Security tabs in the console before considering the browser API route verified. No ECS API service or registered target exists yet, so the CloudFront hostname cannot be expected to serve the API successfully. Amplify frontend hosting, production Cognito callbacks, runtime CORS/origin settings, and end-to-end Google login remain pending. No domain purchase or DNS change was made.

Follow-up console screenshots showed the General tab's Last modified value changed from **Deploying** to `November 11, 2026 at 10:51:58 AM UTC`; the screenshots do not show an explicit **Deployed** status. The Behaviors tab showed one default (`*`) behavior with **HTTPS only**, `Managed-CachingDisabled`, and `Managed-AllViewer`. The Security tab showed WAF **Core protections Enabled**, with Advanced DDoS protection, rate limiting, and SQL protections **Not enabled**. No request to the CloudFront hostname or API smoke test has been performed, and no ECS target exists yet.

The Distributions list subsequently showed distribution `E34GZDTZ2HCOR1` with **Status: Enabled**, type Standard, pay-as-you-go pricing, and an origin name beginning `internal-tutorp...`. This establishes that the distribution is enabled, but the screenshot does not display a separate deployment-progress field or the full origin configuration. The Origins tab remains to be inspected.

The developer then supplied the Origins tab. It shows **one** origin row with type **VPC origin** and an endpoint/name beginning `internal-t...`, consistent with the internal TutorPair ALB and the VPC origin selected in the creation wizard. No origin groups are configured. The table truncates the full origin name and endpoint, so those exact values are supported by the earlier wizard screenshot, not independently readable in this tab. No request-level API verification is possible until an ECS service registers a healthy target.

## 2026-11-11 — Local frontend artifact prepared for manual Amplify deployment

**Performed by:** Codex in the local working tree. **AWS status:** No Amplify app or deployment was created by this preparation.

The current Cognito frontend changes remain uncommitted, so a Git-connected Amplify build would not include them. A production static build was run locally with public build-time values: `VITE_API_BASE_URL=https://d2vk9dqgas2wkp.cloudfront.net`, region `ap-southeast-1`, the recorded pilot Cognito pool/client identifiers, and the recorded Cognito managed-login hostname. `npm run build:shared` and `npm run build:client` succeeded. The build output (`index.html`, one JavaScript bundle, and one CSS bundle) was zipped at `C:\Users\Kcross\AppData\Local\Temp\tutorpair-pilot-client-20261111.zip` for a manual Amplify Hosting deployment; the zip contains the contents of `apps/client/dist` at its root. It contains no database credential, AWS access key, or Cognito client secret. A successful static build does not establish a working cloud login or API flow.

The first sandboxed `npm test` attempt failed because localhost TCP 5432 was denied (`EACCES`); it did not reach the local PostgreSQL test database. The already-running local `tutorpair-postgres` container was then confirmed healthy, and `npm test` was rerun with local Docker/database access. The rerun passed with **257 tests passed, 0 failed, 3 skipped**. Neither test attempt ran the pilot RDS migration or reference-data seed. No AWS resource was changed. Amplify deployment, assigned HTTPS hostname, SPA rewrite, Cognito production callbacks, S3 CORS, and browser verification remain pending.

During the subsequent choice between manual and Git-connected Amplify Hosting, the local Git state changed independently of Codex's actions: branch `feat/cloud_blocker_fix` and its local `origin/feat/cloud_blocker_fix` tracking reference both pointed to commit `de1362c` (`feat: enhance authentication flow and environment configuration`), and the working tree was clean. That commit includes the auth changes and this deployment log through the preceding entry. This local tracking-reference observation is not an independent live GitHub check. Git-connected Amplify is now the preferred deployment path if the branch appears in the AWS repository selector; no manual ZIP upload or Amplify app has been created.

The developer later stated that the repository owner has already installed the AWS Amplify GitHub App for the TutorPair repository. This is developer-reported; the installation account, selected repository scope, and region have not yet been independently inspected. A GitHub screenshot shown during the developer's own connection flow was instead an **Install & Authorize on your personal account Merp-preM** page listing Merp-preM repositories. Codex advised not to install the app on that unrelated personal account for this deployment. The next check is whether Amplify's repository selector can see `nnpx/TutorPair-personalized-tutor-matching` through the existing owner installation and the developer's GitHub authorization. No installation or Amplify deployment by the developer is confirmed by that screenshot.

The developer subsequently reported that `feat/cloud_blocker_fix` has been merged into `master`. This merge has not been independently verified from the live GitHub remote because read-only Git remote access from Codex failed. The Amplify Add repository and branch screenshot showed the intended repository URL entered, `master` in the branch field, **My app is a monorepo** checked, and an invalid root directory of `src` with a validation error. The required monorepo app root is `apps/client`. No Amplify app creation was shown.

The Amplify Review screenshot later showed repository `nnpx/TutorPair-personalized-tutor-matching`, branch `master`, monorepo root `apps/client`, app name `tutorpair-pilot-web`, the shared/client frontend build command from the repository YML, Standard build instance, default build image, and the five intended public `VITE_*` values (CloudFront API URL, AWS region, Cognito pool, SPA client, and Cognito domain). Codex reviewed the screen and advised **Save and deploy**. The developer then reported that Amplify displayed an error and prompted another attempt, but the error text was not captured. **No successful app creation or build is confirmed.** Check the Amplify All apps list and any existing app's build history before retrying, to avoid duplicate apps or builds. No manual ZIP deployment is confirmed.

The developer confirmed that `tutorpair-pilot-web` does not exist in Amplify and that the console returned to the usual Create new app view. In the GitHub connection, **Select from list** shows only repositories owned by the developer's `Merp-preM` account and does not show the `nnpx` TutorPair repository, despite the owner-reported app installation. The earlier **Enter repository URL** attempt ended in an uncaptured creation error. Git-connected deployment is therefore not currently established for this AWS/GitHub user connection. The prepared manual ZIP is the practical next path for the short pilot; no GitHub or Amplify permission change has been verified.

A later screenshot captured the actual failed Git-connected Amplify setup error: **Build failed — There was an issue setting up your repository. Please try again later.** The embedded GitHub error was `Resource not accessible by integration`, HTTP **403**, for `https://docs.github.com/rest/repos/webhooks#list-repository-webhooks`. This identifies a repository integration/webhook-access failure during setup, not an application compilation failure. GitHub documents that listing repository webhooks requires repository Webhooks read permission; the screenshot does not by itself identify whether the lacking permission is on the GitHub App installation, user authorization, or repository owner account. Repeating the same Git-connected setup without a permission change is unlikely to help. The developer previously confirmed no Amplify app exists; manual ZIP deployment remains pending.

The developer then chose to continue with Git-connected hosting rather than the manual ZIP. The proposed route is to fork the public TutorPair repository into the developer's own GitHub account `Merp-preM`, then install the regional Amplify GitHub App with access limited to that fork and connect its `master` branch. This avoids the current cross-account webhook authorization failure, but the fork will need to be synced from upstream for later upstream changes. No fork or new Amplify app is confirmed yet.

The developer asked for a way to keep hosting directly from the original `nnpx` repository without forking. Another path is for the repository owner to verify that the **ap-southeast-1** Amplify GitHub App installation includes the TutorPair repository and then perform the Amplify GitHub authorization/connection using their own GitHub identity while signed into the authorized AWS account. For a personal-account repository, GitHub offers owner and collaborator levels; collaborator write access does not provide owner-level webhook administration. A repository transfer to an organization with an admin role is a larger alternative, not required for the pilot. No such owner-assisted connection or transfer has occurred.

The developer then chose the manual Amplify deployment path. The **Start a manual deployment** screenshot shows Drag and drop selected, default app name `app4901`, branch name `staging`, and no ZIP selected yet; **Save and deploy** is disabled. The intended form values are app name `tutorpair-pilot-web`, branch name `pilot`, and the prepared ZIP containing the production static build. No Amplify app or deployment is confirmed by this screenshot.

Before the manual upload, Codex verified that the prepared ZIP matches the latest GitHub `master` frontend. A read-only `git ls-remote --heads origin master` succeeded and returned commit `bdb84c895de202778ceff5290c80729bcf285ee1`, matching local `master`. A source diff from the ZIP's auth implementation commit `de1362c` to that merge commit found no changes in `apps/client`, `packages/shared`, `package-lock.json`, or `amplify.yml`. Codex rebuilt shared and client from local `master` using the same public pilot build variables; both builds passed. SHA-256 hashes of all three ZIP entries (`index.html`, JavaScript, CSS) exactly matched the corresponding fresh `master` build files. The ZIP is therefore current for the verified GitHub `master` commit. The only local uncommitted change remains this deployment log; it does not affect the frontend artifact. This GitHub remote check is separate from the earlier failed read-only **AWS CLI** checks, which are still not claimed as successful.

## 2026-11-11 — Pilot frontend manually deployed to Amplify

**Performed by:** Human developer in the Amplify console. **Evidence:** Developer-provided post-deployment app overview screenshot. No successful AWS CLI verification is claimed.

Amplify app `tutorpair-pilot-web` was created with app ID `ddn2qrfc4g8y1`. The manual branch `pilot` shows **Deployed** and is marked the production branch. Its assigned HTTPS URL is `https://pilot.ddn2qrfc4g8y1.amplifyapp.com`. The screenshot shows one branch and a deployment marked `0 minutes ago`. The deployment used the previously prepared static ZIP according to the developer's selected manual flow; the screenshot itself does not show the uploaded artifact name or contents. The ZIP was locally checked against GitHub `master` commit `bdb84c8` before upload. The screenshot does not establish that direct SPA routes, Cognito Google login, API calls, or browser S3 uploads work. No custom domain was added; the optional Amplify firewall and Git branch integration were not enabled on the visible page.

Next verify that the site root and direct `/login` URL both load over HTTPS. Then configure the Cognito SPA client's production callback/logout URL to the actual Amplify `/login` route, set the API task's `ALLOWED_ORIGIN` to this Amplify origin and `TUTOR_PORTAL_URL` to its `/tutor/profile` route, and configure private S3 bucket CORS for this origin. Those settings and the ECS API service remain pending.

The developer supplied a browser screenshot showing the TutorPair sign-in page, including the **Continue with Google** button, rendered from the deployed frontend. The screenshot excludes the browser address bar, so it does not independently prove whether this was the site root or a direct request to `/login`; a separate direct-route/URL check remains pending. Google sign-in was not attempted or verified by this screenshot.

The developer then supplied a browser screenshot with the address bar visible at `pilot.ddn2qrfc4g8y1.amplifyapp.com/login/` and the TutorPair sign-in page rendered. This confirms that the direct login route resolves and displays the SPA; the visible URL has a trailing slash. The screenshot alone does not establish whether Amplify redirected an initial `/login` request to `/login/`, or whether OAuth callback query parameters survive that behavior. No Google login was attempted. A concurrent Cognito app-client **Login pages** screenshot shows managed login Available, Cognito user pool directory and Google identity providers, authorization code grant, `email` and `openid` scopes, and only `http://localhost:5173/` for allowed callback, default redirect, and allowed sign-out URLs. The production callback and sign-out URLs have not yet been added. The Cognito screenshot contains no client secret value.

The next developer screenshot shows the Cognito managed-login edit form, not a saved configuration. It has the production `https://pilot.ddn2qrfc4g8y1.amplifyapp.com/login` URL in the allowed callback and sign-out fields and as the default redirect. Only this production URL is visible in those lists; localhost entries are absent. Cognito user pool and Google remain selected, as does authorization code grant. The form still selects only `email` and `openid` OIDC scopes, while the deployed frontend configuration requests `openid`, `email`, and `profile` (`apps/client/src/main.tsx`). `profile` must be added before saving for the configured OAuth request to match allowed scopes. No saved Cognito change is claimed yet.

## 2026-11-11 — Production Cognito SPA redirects saved

**Performed by:** Human developer in the Cognito console. **Evidence:** Developer-provided form review and post-save success screenshots; no successful AWS CLI verification is claimed.

The app client `tutorpair-pilot-spa` (`irch38183ksbnqcgabscq78oo`) shows a success banner and saved **Login pages** settings. Allowed callback URL, default redirect URL, and allowed sign-out URL are each exactly `https://pilot.ddn2qrfc4g8y1.amplifyapp.com/login` (without trailing slash). The only URL shown in each list is this production URL; the former localhost entries were removed. Managed login remains Available, Cognito user pool directory and Google remain enabled, authorization code grant remains selected, and OIDC scopes are `email`, `openid`, and `profile`, matching the frontend OAuth request. The screenshot shows no client secret. The frontend's direct-route screenshot showed `/login/` in the browser, so actual OAuth callback behavior still requires verification after the API is healthy. No Google sign-in or end-to-end app session has been attempted since this change. S3 browser CORS and the ECS API service remain pending.

## 2026-11-11 — Pilot document bucket browser CORS saved

**Performed by:** Human developer in the S3 console. **Evidence:** Developer-provided bucket Permissions CORS card screenshot; no successful AWS CLI verification is claimed.

The saved CORS card for `tutorpair-pilot-documents-528301714999-ap-southeast-1-an` shows one rule: allowed origin `https://pilot.ddn2qrfc4g8y1.amplifyapp.com`, methods `GET` and `PUT`, allowed header `Content-Type`, empty exposed headers, and preflight max age 300 seconds. The visible **Edit** and **Copy** controls indicate the screenshot is the bucket's CORS display rather than an unsaved edit form. This rule does not alter the bucket's private access controls or grant object permissions. Actual browser upload and read behavior remain untested until the API issues presigned URLs and the ECS service runs.

## 2026-11-11 — SES identity list rechecked after domain identity deletion

**Performed by:** Human developer in the SES console. **Evidence:** Developer-provided Identities list screenshot with a success banner; no successful AWS CLI verification is claimed.

The developer stated that they deleted the unusable `tutorpair.com` SES identity. The refreshed SES Identities list shows exactly two entries, both individually verified email addresses: `manager.des424@gmail.com` and `tech.plumber.des424@gmail.com`. It shows no `tutorpair.com` domain identity. This observation concerns SES identities; the separate Route 53 `tutorpair.com` hosted zone had already been deleted and verified absent in an earlier entry. SES sandbox status was previously confirmed and is not changed by this screenshot. A sender still needs to be chosen and granted narrowly scoped `ses:SendEmail` permission on the API task role; no email has been sent.

The developer declined to use either existing verified SES email identity because they belong to the professor's other resources. A distinct pilot sender identity using an email address controlled by the developer is now required. The earlier proposed `TutorPairPilotSesSender` IAM policy for `manager.des424@gmail.com` was guidance only; the developer did not report creating it. Do not configure the API with either existing sender address. Creating a new SES email identity does not create a mailbox; verification requires access to the chosen mailbox. No new sender identity or policy is confirmed yet.

The developer showed the SES **Create identity** form for a dedicated pilot email address, `tutorpair.admin@gmail.com`. **Email address** is selected; the optional default configuration set and tenant assignment are unchecked. The screenshot is a pre-submission form with **Create identity** available, not evidence of creation or verification. The console warns that mail sent from an email-address-only identity can be quarantined or rejected depending on the Gmail domain's DMARC policy. This risk must be checked with an actual delivery test; no domain purchase or DNS authentication is planned for the pilot.

The developer then completed email verification. A refreshed SES Identities list screenshot shows `tutorpair.admin@gmail.com` as an **Email address** identity with green **Verified** status. The two professor-owned individual identities remain listed and verified; the unused `tutorpair.com` domain identity is absent. Use the dedicated `tutorpair.admin@gmail.com` identity for the pilot `SES_FROM_EMAIL` and narrowly scoped task-role sending policy. This screenshot confirms SES verification only, not successful mail delivery, sandbox exit, IAM permission, or API deployment. No test email has been sent.

The developer opened IAM's **Review and create** screen for an inline policy named `TutorPairPilotSesSender`. The permissions summary lists three related service labels (Pinpoint Email, SES, SES v2) with limited write access but truncates the actual action and resource scope. The screenshot does not show the raw JSON or the role breadcrumb. Do not treat the scope or attachment target as verified, and do not create the policy until the JSON and intended `tutorpair-pilot-ecs-task-role` context are visually checked. No policy creation is confirmed.

The developer then showed the policy JSON editor. The single visible statement has `Effect: Allow`, `Action: ses:SendEmail`, and `Resource: arn:aws:ses:ap-southeast-1:528301714999:identity/tutorpair.admin@gmail.com`; IAM reports zero errors and warnings. This verifies the proposed statement limits sending to the newly verified pilot identity. The screenshot still does not show the role breadcrumb, and the policy has not yet been confirmed created or attached. Verify on the resulting role Permissions page that it is attached to `tutorpair-pilot-ecs-task-role`, not the execution or migration role.

The developer then supplied the IAM role Permissions page with a green `Policy TutorPairPilotSesSender created` banner. The page heading and ARN identify `tutorpair-pilot-ecs-task-role`, and its two customer inline policies are `TutorPairPilotDocuments` and `TutorPairPilotSesSender`. Together with the previously reviewed JSON screenshot, this confirms the dedicated task role now carries the narrow SES send permission for the new pilot identity. No SES message has been sent, and ECS has not yet used the role.

## 2026-11-11 — API ECS task definition prepared locally

**Performed by:** Codex in the local working tree. **AWS status:** No API task definition or service is confirmed registered.

The new [API task-definition JSON](./ecs-api-task-definition.json) pins the tested `linux/amd64` ECR image by digest `sha256:3ba1d4a1d2c634c6c66d0997e2845f55c3afbcf5e88bbb72bf13f8f445e92f1c`, selects Fargate x86_64 at 0.5 vCPU / 1 GiB, exposes container TCP 4000, and uses the dedicated API execution and application task roles. `DATABASE_URL` references only the application Secrets Manager ARN with JSON-key extraction (`:tutorpair/pilot/api/database-url::`); no secret value is in the file. Non-secret environment settings specify the real Amplify origin, tutor portal URL, Cognito pool/client, private S3 bucket, SES mode and newly verified sender, and the bundled RDS CA path. The ECS container health check uses `/api/health` for process liveness; the ALB target group separately uses `/api/ready` for database readiness. Logs go to the existing `/ecs/tutorpair-pilot-api` group with prefix `api`. The JSON parsed and required fields passed local checks; `git diff --check` passed. This preparation neither starts a chargeable Fargate task nor proves the image can reach RDS, SES, S3, or Cognito. The task definition needs console review before registration, then a separate service/network configuration and target-health check.

The developer showed the ECS **Create task definition with JSON** editor containing the top section of the prepared definition; it displayed zero editor errors and warnings. They then supplied the full JSON text from that editor. The visible family, Fargate x86_64 CPU/memory, distinct API roles, pinned image digest, port 4000, production environment values, `DATABASE_URL` application-secret ARN with the exact JSON key, `/api/health` container check, and CloudWatch log settings match the prepared file. No secret value was shown. This is a pre-registration review; no task definition, ECS service, target health, or runtime connectivity is confirmed yet.

## 2026-11-11 — API ECS task definition registered

**Performed by:** Human developer in the ECS console. **Evidence:** Developer-provided task-definition success and overview screenshot; no successful AWS CLI verification is claimed.

Task definition `tutorpair-pilot-api:1` was created and shows **ACTIVE** in account `528301714999`, region `ap-southeast-1`. Its overview shows Fargate, Linux/X86_64, `awsvpc`, task CPU 512 units (0.5 vCPU), task memory 1,024 MiB, task role `tutorpair-pilot-ecs-task-role`, task execution role `tutorpair-pilot-ecs-execution-role`, essential `api` container, and the expected ECR image digest. The full JSON was reviewed immediately before registration and matched the local [task-definition file](./ecs-api-task-definition.json). The overview's **Secrets Manager ARN or name** field under Private registry is not the `DATABASE_URL` environment-secret field; its dash does not establish missing database injection. No ECS service or running API task exists yet, so secret access, RDS reachability, logs, target health, and CloudFront API behavior remain unverified. Registering the definition alone starts no Fargate compute charges.

The developer opened the ECS **Create service** form, but has not submitted it. The task family `tutorpair-pilot-api`, revision `1`, service name `tutorpair-pilot-api`, Fargate launch type, LATEST platform version, Replica scheduling, and desired count `1` are visible. The form currently has all four pilot subnets selected, including two private subnets that lack the intended outbound path; the default security group `sg-038820413801e55b8` is selected instead of the restricted TutorPair ECS group. Public IP is On. Load balancing is enabled for `api 4000:4000`, but the wizard still selects **Create a new load balancer**, which states it would be internet-facing, and **Create a new target group**. These settings must be corrected to the two public subnets, `sg-08e70b827fdf44081`, existing internal ALB, and existing `tutorpair-pilot-api-tg` before service creation. The health-check grace period shows 0 seconds and should be set for API startup. No new resource is confirmed created by this form.

The developer supplied corrected pre-submission service screenshots. Desired tasks remain `1`, health-check grace period is `180` seconds, and the VPC is `vpc-09afdab2ced554af7`. Only public subnets `subnet-0d62a470014fdd6cc` (ap-southeast-1a) and `subnet-0200e4aade29adfb1` (ap-southeast-1b) are selected. The only selected task security group is `tutorpair-pilot-ecs-sg` (`sg-08e70b827fdf44081`), and Public IP is On. Load balancing selects container `api 4000:4000`, **Use an existing load balancer** with internal `tutorpair-pilot-api-int-alb`, its existing HTTP:80 listener, and **Use an existing target group** with `tutorpair-pilot-api-tg`; the shown health path is `/api/ready` over HTTP. The listener rules table shows its default rule forwarding to this target group. No new ALB, listener, or target group is selected. Availability Zone rebalancing remains On; with one desired task, this does not make the service highly available. The form has not yet been submitted; no API task or target health is confirmed.

## 2026-11-11 — API ECS service created; health pending

**Performed by:** Human developer in the ECS console. **Evidence:** Developer-provided cluster Services screenshot; no successful AWS CLI verification is claimed.

The ECS console shows a green success banner for service `tutorpair-pilot-api-service-kuj65cw1`. Cluster `tutorpair-pilot-cluster` is Active with **1 active service**, **1 running task**, and **0 pending tasks**. The Services table shows the one service as Active, Replica, and Fargate. The generated service name differs from the `tutorpair-pilot-api` value shown in the pre-submission form; use the actual service name from the success banner for subsequent checks. The screenshot does not show the service's task-definition revision, network attachment, load balancer registration, events, logs, or target health. The service has started Fargate compute and one public IPv4 address may be accruing hourly charges; do not claim the API route is healthy yet. Do not attempt Google login until target and API checks pass.

The developer then supplied the service **Health and metrics** overview. Service `tutorpair-pilot-api-service-kuj65cw1` is Active with **1 desired / 1 running / 0 pending**, task definition `tutorpair-pilot-api:1`, deployment status **Success**, and health-check grace period **180 seconds**. The Load balancer target health section shows container `api:4000` with **1 Healthy / 0 Unhealthy** targets and a linked target group/load balancer; the names are truncated in this screenshot, while the pre-submission form showed the intended existing `tutorpair-pilot-api-tg` and internal ALB. This establishes ECS and ALB target health from the console, but not yet the CloudFront browser route, API response contents, logs, or end-to-end authentication. No Google sign-in has been attempted. The service remains chargeable while running.

The developer then opened both unauthenticated CloudFront API endpoints in a browser. Address-bar screenshots at `d2vk9dqgas2wkp.cloudfront.net/api/health` and `/api/ready` show JSON responses `{"status":"ok",...}` and `{"status":"ready","database":"ok"}`, respectively. This verifies the browser path through the CloudFront hostname to a running API task and a successful RDS readiness query at that moment. It does not yet prove CORS preflight, authenticated endpoints, Google callback handling, S3 uploads, or SES delivery. The health response contained a timestamp only, not a secret. No Google sign-in has been attempted yet.

## 2026-11-11 — Browser Google sign-in reached student dashboard

**Performed by:** Human developer in the hosted frontend. **Evidence:** Developer-provided post-login browser screenshot; no AWS CLI or direct database inspection is claimed.

After the CloudFront health and readiness checks passed, the developer used the Google sign-in flow and returned to `pilot.ddn2qrfc4g8y1.amplifyapp.com/student/matching`. The page shows the TutorPair student pathway with the signed-in account displayed in the header and a Logout control. The account address is intentionally omitted from this log. This is strong browser evidence that the Cognito/Google redirect, the deployed `/login` callback handling, and initial role sync through the API produced a STUDENT session; the frontend's production callback routes to the dashboard after `/api/auth/sync` returns user data. The screenshot alone does not independently establish the PostgreSQL user count, durable session restoration after refresh, document upload, matching, or SES delivery. No authorization code or token was shown in the screenshot. A direct refresh and authenticated page request are the next checks.

The developer then supplied a browser screenshot at the direct `/student/profile` route, following the requested refresh/navigation. The Student Profile & Preferences form rendered with populated, non-default fields. The account and contact values visible on the screenshot are intentionally omitted from this log. In the deployed frontend, the profile hook calls the protected `/api/students/profile` endpoint and initializes the form from a returned profile object, so this is further evidence that the browser retained an authenticated session and loaded application data through the CloudFront API route. The screenshot does not show network response codes, so it is not an independent request trace. No profile update or other submission is claimed from this screenshot. SES delivery, S3 browser upload, and complete student/tutor matching remain untested.

## 2026-11-11 — Dedicated SES identity delivered a console test email

**Performed by:** Human developer in the SES console and their own mailbox. **Evidence:** Reviewed pre-send SES form screenshots and developer-provided Gmail message screenshot; no AWS CLI or API-task email test is claimed.

The SES test form selected **Formatted**, From `tutorpair.admin@gmail.com`, **Custom** recipient at the same verified address, subject `TutorPair pilot SES check`, and a short non-sensitive test body. The Gmail screenshot shows that exact subject and body from the pilot identity via `amazonses.com`. **Correction from the developer:** The message initially arrived in Gmail **Spam**, despite the screenshot displaying an Inbox label. The message was delivered to the mailbox, but this test signals a deliverability risk for the sender configuration and does not establish reliable inbox placement. It does not verify delivery to other domains or recipients, the ECS task role's `ses:SendEmail` permission at runtime, or application notification dispatch. The professor-owned SES identities were not used. No secret or message identifier is recorded.

The developer showed the hosted `/login/` page with **Register** active, **Tutor** selected, and the button labeled **Sign Up with Google as Tutor**. This is a reviewed pre-authentication state only. The next Google account chooser must use the separate pilot account, not the previously used student identity, because the first synced role is immutable. No tutor Cognito identity, RDS user, document, or S3 object is confirmed from this screenshot.

The developer then supplied a browser screenshot at `pilot.ddn2qrfc4g8y1.amplifyapp.com/tutor/profile`. It displays the Tutor Portal, Tutor Pathway dashboard, and the separate dedicated pilot account in the header. This is strong browser evidence that Google sign-in and first role synchronization produced a TUTOR session, separate from the earlier STUDENT session. The account address is not repeated here. The screenshot shows the no-profile onboarding roadmap, not a submitted tutor profile, verification document, or approved tutor. The tutor onboarding form and subsequent browser S3 PUT remain to be tested.

The next developer screenshot shows the tutor onboarding form at **Step 4, Verification Docs**. The preceding **Profile & Style**, **Subjects & Rates**, and **Weekly Schedule** steps each have a green completion check. The visible mandatory upload slots are Degree/Academic Transcript, CV/Resume, and subject-specific proof for **IELTS Academic (Target 6.5+)**. Each visible file picker says **No file chosen**. This screenshot indicates onboarding progress in the UI, but does not independently verify saved values for the first three steps, any S3 upload, or tutor approval.

Codex created three one-page synthetic PDF files under `output/pdf/` for the matching slots. Each prominently states **PILOT TEST ONLY — NOT A CREDENTIAL**, contains no personal data or qualification claim, and instructs reviewers not to approve it as a real tutor document. The files were rendered and visually checked locally. They have not been selected in the browser or uploaded. If used to test the presigned S3 upload path, keep the pilot tutor account pending and remove the test files after verification.

## 2026-11-11 — Tutor verification submission reached pending dashboard

**Performed by:** Human developer in the hosted frontend. **Evidence:** Developer-provided post-submission Tutor Portal screenshot. The screenshot showing the final submit button was not supplied before submission; no browser network trace, AWS CLI result, or S3 console object listing has been reviewed.

The developer reported selecting the three synthetic pilot PDFs for the degree/transcript, CV/resume, and IELTS proof slots, then supplied a Tutor Portal screenshot showing **Application Under Admin Review** and **Status: Pending**. The same screen shows one IELTS teaching focus and one weekly availability slot. The visible account and contact details are intentionally omitted from this log. In the current frontend, the pending dashboard is shown when the verification API response contains at least two documents; this is evidence of at least two document records being returned to the browser, but the screenshot does not identify their types, confirm the third proof record, or independently show the S3 objects. The pending state is appropriate for synthetic files, which must never be approved as credentials. Next inspect **My Profile → Verification Docs** for all three submitted document entries, then, if needed, verify the private S3 object listing without opening or exposing signed URLs. Application email sending remains untested.

The developer then supplied the **My Profile → Verification Docs** screenshot. It shows the **Verification Pending Review** banner and three separate uploaded entries: `Degree_Transcript.pdf`, `CV_Resume.pdf`, and `Subject_Proof_1.pdf` under **IELTS Academic (Target 6.5+)**. Each is displayed as 3 KB with a November 11, 2026 upload date; the file chooser beneath the subject proof says **No file chosen**, consistent with cleared local staging. This confirms the hosted browser received all three document metadata records through the tutor verification flow. In the deployed client code, each successful upload mutation requests a presigned PUT, sends the file directly to S3, then confirms metadata with the API; the screenshot supports that sequence completing from the application's perspective, but it is not an independent S3 object or content check. The files remain synthetic test material, and tutor status remains pending. A read-only S3 object-list check is the next independent storage verification; do not approve the tutor.

The developer supplied a read-only S3 console listing for the pilot tutor's `tutors/{tutorId}/` prefix. It shows a UUID-suffixed CV PDF (2.1 KB), a UUID-suffixed transcript PDF (2.1 KB), and a `subject-proof/` folder. Both visible PDFs were last modified on November 11, 2026 (console display, UTC+07:00). This independently confirms the CV and transcript objects are present in S3; the third proof object's existence is not yet shown because the folder has not been opened. No object was opened, downloaded, shared, or approved. Next inspect the `subject-proof/` folder listing only.

The developer then supplied the `subject-proof/` Objects listing. It shows exactly one UUID-suffixed PDF object (2.1 KB), last modified November 11, 2026 at 21:15:50 (UTC+07:00). Together with the parent listing, the S3 console independently confirms all three pilot document objects exist at their expected tutor prefix locations. The browser separately shows all three corresponding document metadata entries and pending review status. This verifies the upload and confirmation path from the browser and object-presence perspective; it does not prove object content, admin viewing through presigned GET, actual credential validity, or email dispatch. All three are synthetic test documents. The tutor must remain unapproved.

The developer copied an unsigned S3 object URL and opened it in a Chrome Incognito window. The provided browser screenshot shows S3 XML with `Code: AccessDenied` and `Message: Access Denied`. This confirms that this direct, unauthenticated URL did not expose the selected pilot document. It does not establish the access policy of every object, the behavior of an authorized presigned GET, or admin-only access. No signed URL, credential, or document contents were recorded.

The developer then opened the CloudFront `/api/admin/tutors` URL directly in a browser without an Authorization header. The displayed JSON is `{"success":false,"message":"Missing or malformed Authorization header"}` and contains no tutor data. This verifies the unauthenticated admin queue request was rejected at the application layer. The screenshot does not show the HTTP status code, an authenticated non-admin request, or a successful admin session. No bearer token was shared.

The developer used the existing VPC CloudShell environment to run a read-only `SELECT count(*) AS admin_users FROM users WHERE role = 'ADMIN'` against the pilot RDS database. The provided result screenshot shows `admin_users = 0` and one returned row. No database password or user email was shared. This establishes that no application ADMIN row existed at the time of the query. It does not identify a suitable Cognito identity or authorize promoting the existing student or synthetic tutor account. Dedicated admin provisioning is required before the admin queue or presigned document-view flow can be tested.

The developer reported adding a separate email address to the Google Auth Platform test-user list for the pilot OAuth app. No saved Audience list screenshot has been reviewed, so the entry's exact address and persistence are not independently confirmed. This allowlist change permits a separate Google identity to attempt OAuth sign-in; it does not create a Cognito user, a TutorPair database user, or any ADMIN privilege. The next step is to verify the intended distinct identity at the hosted registration screen before first sign-in.

The developer supplied a pre-sign-in screenshot of the hosted registration page showing **Register**, **Student / Parent**, and **Sign Up with Google as Student** selected. This is the intended temporary self-registration path for a distinct future pilot admin identity; it grants only STUDENT access initially. No Google account chooser, Cognito redirect, database row, or admin privilege is confirmed by this screen. Review the selected Google account before completing the OAuth sign-in so the existing student and synthetic tutor identities remain untouched.

The developer then reported using the newly added separate Google identity and supplied a browser screenshot at the hosted `/student/matching` route. The page displays the Student Pathway onboarding screen, the new signed-in account in the header, and Logout. The email address is intentionally omitted from this log. This is browser evidence that the Google/Cognito callback and first role sync reached a STUDENT session for the intended new identity; the screenshot alone does not independently show the PostgreSQL row or Cognito subject. No student profile is shown as completed, and no ADMIN privilege has been granted. A read-only query targeting this account's database row and checking for an existing student profile must precede any privileged role change.

The first CloudShell attempt entered SQL at the Bash prompt and then passed only bare `SELECT` to `psql -c`; it returned no useful account fields and made no database change. The subsequent correctly quoted, read-only query returned the newest `users` row for the newly signed-in account: role `STUDENT`, a November 11, 2026 creation timestamp, and `has_student_profile = false`. The developer confirmed the returned email matches the separate intended admin identity; the address and UUID are intentionally omitted here. This is sufficient to prepare an exact-ID, exact-email, prior-role-guarded admin promotion transaction, but no role change has been submitted or committed. Keep the original student and synthetic tutor accounts untouched.

The developer entered a PostgreSQL transaction for that new account only. The guarded `UPDATE users SET role = 'ADMIN', updated_at = now()` required its exact UUID, exact email, prior `STUDENT` role, and absence of a `students` profile. The developer-provided `RETURNING` output showed exactly one row with the intended UUID and `ADMIN`, followed by `UPDATE 1`; the prompt remained in transaction state. Codex reviewed that output and instructed `COMMIT;`. The developer then reported completing the commit, but no `COMMIT` output or independent post-commit query has yet been supplied. The privileged role change is therefore reported, pending read-only verification. No other user row, tutor verification status, or document was intentionally changed.

The developer then ran a read-only post-commit query by exact UUID. The result shows the intended row with role `ADMIN`, a November 11, 2026 `updated_at` timestamp, and `admin_users = 1` across the `users` table. This independently verifies the promotion persisted and that exactly one application ADMIN row exists at the time of the check. The new identity has not yet been tested in the hosted admin UI, and no tutor was approved or rejected. The account's email and UUID are intentionally omitted from this log.

The developer then signed back in with the new identity and supplied a hosted browser screenshot at `/admin/verifications`. It shows the **ADMIN PORTAL** header, the new account in the header, **Pending Review 1**, **Approved Tutors 0**, **Rejected Applications 0**, and **All Applications 1**. The only visible applicant is the synthetic pilot tutor, marked **PENDING**, with one IELTS teaching offering. This is browser evidence that the Cognito-authenticated identity now passes the application's ADMIN route and loads the protected verification queue and detail panel. It does not yet verify the admin document-view presigned GET, review decision endpoints, email dispatch, or student matching. No approval or rejection was made. The queue card's contact/type text wraps awkwardly in the provided viewport; this is a presentation issue to review before the professor demo. Account and contact details are intentionally omitted from this log.

The developer supplied a second admin-panel screenshot showing **Amazon S3 Documents (3)** with individual **View** controls for subject qualification (IELTS), CV, and degree transcript. The synthetic tutor remains marked **PENDING**. The developer reported that clicking View works, but this screenshot shows the document list rather than the opened PDF or request result. The authorized presigned GET is therefore user-reported, not yet independently confirmed from the screenshot. No approval or rejection is evidenced. A screenshot of one synthetic PDF rendered in the new tab, with its signed URL hidden, would establish browser viewing without exposing the temporary URL.

The developer then supplied a browser PDF-viewer screenshot of the IELTS subject-proof test file after using the admin **View** control. The one-page PDF visibly renders **PILOT TEST ONLY — NOT A CREDENTIAL**, **IELTS PROOF SLOT**, and a warning against approving it as a real tutor document. The address bar and signed URL are absent from the screenshot. In the deployed admin UI, View calls the admin-only document view-url endpoint and opens the returned URL; combined with the earlier unsigned URL `AccessDenied` result, this is strong browser evidence that authorized presigned GET viewing works for this synthetic proof. The screenshot itself does not expose the URL parameters or independently prove URL expiry, every document's readability, or non-admin access denial. The PDF's instructions are test-file content, not an authorization to delete documents or change tutor status. The synthetic tutor remains unapproved and must not be approved as a credential holder.

The developer reported an unspecified UI bug while attempting to proceed to student matching and explicitly chose to skip that test for now. No screenshot, error text, or reproduction steps were supplied, so the specific defect and whether any matching request was submitted are unknown. Do not claim matching or pending-tutor exclusion was verified. Continue with independent, read-only pilot checks and leave the synthetic tutor pending.

Codex attempted a read-only production mock-token rejection check from the restricted local execution sandbox, but `curl` failed before any HTTP response because that environment could not resolve the CloudFront hostname. This is not a production API result and verifies nothing about token handling. A user-side request from a network path that can reach the site is still required.

The developer ran that check from Windows PowerShell against CloudFront `/api/auth/me` with a synthetic `mock-token-pilot-check` bearer value. The supplied output shows **HTTP/1.1 401 Unauthorized** and JSON `{"success":false,"message":"Mock authentication is disabled in production"}`. CloudFront and Express response headers are visible; no real credential or application data was sent or returned. This verifies the deployed API rejects the local mock-token bypass in production for this endpoint. It does not independently test every role guard or token format. The local development mock path remains a separate test concern.

## 2026-11-12 — API CloudWatch log stream located

**Performed by:** Human developer in the CloudWatch console. **Evidence:** Developer-provided log-group details and Log streams screenshot.

The `/ecs/tutorpair-pilot-api` log group in `ap-southeast-1` shows Standard class, **1 week** retention, about **1.53 KB** stored, and **6** visible log streams. One stream has the expected API prefix `api/api/` and a last-event time of November 11, 2026 at 13:45:57 UTC. The other five visible streams are one-off migration and reference-seed tasks. This confirms the API task created a CloudWatch log stream; the screenshot does not show its event contents or prove that every request is logged. Next open the `api/api/` stream and inspect its events, avoiding disclosure of any secret or personal value.

The developer opened the `api/api/` stream and supplied its Log events screenshot. It shows three startup messages at November 11, 2026 13:45:57 UTC: the TutorPair API server running on port 4000 in production, the allowed CORS origin set to the Amplify pilot hostname, and `[email] SES delivery enabled`. No older or newer events appear in the displayed stream. These lines confirm startup configuration logging and that the email worker was enabled; they do **not** establish that SES sent an application email, that the worker processed a job, or that API requests are logged. The screenshot contains no secret value. The UI's lack of later events is not by itself evidence of an outage, because request logging has not been established.

## 2026-11-12 — Current pilot cost review pending

The next selected operational check is read-only Cost Explorer review for the November 9–12 pilot period, with the November 19 professor review and subsequent teardown decision in view. Computer access to the developer's open Chrome window was denied, so no current billing screen or cost figure was inspected in this step. Cost Explorer totals in account `528301714999` include unrelated workloads; service or regional totals alone must not be attributed to TutorPair. Await a developer-provided Cost Explorer screenshot before recording observed costs. AWS Budgets remains deferred. No resource or billing setting was changed.

The developer then redirected the pilot away from further billing review and back to AWS configuration and application verification. The next check is a read-only current-state review of ECS service/task health, the existing ALB target group, and public API readiness. No new cost observation is claimed, and the November 19 post-review teardown decision remains pending.

The developer supplied an ECS **Health and metrics** screenshot for `tutorpair-pilot-api-service-kuj65cw1`. It shows **Active**, **1 desired / 1 running / 0 pending** task, task definition `tutorpair-pilot-api:1`, deployment status **Success**, a 180-second health-check grace period, and `api:4000` with **1 Healthy / 0 Unhealthy** load-balancer targets. The three-hour CPU and memory charts appear low in the displayed window, but the screenshot does not establish a load test or performance capacity. The page says **No load balancer metrics available**; this does not override its target-health report. This is current console evidence of service and target health at the time of the screenshot, not proof of public route availability or SES dispatch. No resource change is shown.

The developer then supplied a browser screenshot of `d2vk9dqgas2wkp.cloudfront.net/api/ready` returning `{"status":"ready","database":"ok"}`. This confirms that the public CloudFront route reached the API and its database readiness check succeeded at the time of the screenshot. It does not establish sustained availability, authenticated application behavior, matching, or email delivery. No secret, signed URL, or account data appears in the screenshot.

The developer supplied the RDS **Automated backups** details screenshot for `tutorpair-pilot-db`. It shows backup retention **7 days**, earliest restorable time **November 9, 2026, 20:55 (UTC+07:00)**, latest restorable time **November 12, 2026, 13:38 (UTC+07:00)**, and four listed system snapshots, each **available** and **Completed**. Encryption is enabled; the database status is **active** in `ap-southeast-1a`. This is evidence of configured and currently available automated backup history, not a tested restore or proof that every point in the window can be recovered. No restore or setting change was made. The screenshot also shows no tags on this DB; no tagging change is proposed during this app-verification pass.

The developer supplied another admin verification-page screenshot. It shows **Pending Review 1**, **Approved Tutors 0**, **Rejected Applications 0**, and **All Applications 1**. The selected synthetic pilot tutor is still **PENDING**. The detail panel lists three document records and visible **View** controls for subject qualification, CV, and degree transcript. This confirms the queue and document metadata remain visible in the admin UI at the time of the screenshot; it does not show a new document being opened, a review decision, or an email send. The queue card's contact email still wraps awkwardly at this viewport. Contact details visible in the image are intentionally omitted from the log. Do not approve the synthetic files as credentials.

The developer supplied a PDF-viewer screenshot after opening the synthetic **CV** from the admin document list. The page visibly renders the **PILOT TEST ONLY — NOT A CREDENTIAL** header and **CV / RESUME SLOT** content; the browser address bar and signed URL are hidden. This confirms that this CV test file rendered in the browser, while the prior screenshot already established the IELTS proof rendering. The developer reports the other requested document view was also fine; no degree-transcript PDF screenshot or network trace was supplied, so its readability is user-reported rather than independently visible here. Text inside the synthetic PDF is evidence about test content, not authorization to delete files or change tutor status. No approval, rejection, or deletion is shown.

The developer supplied the EC2 security-group details screenshot for `sg-050ef93b36cb160f1`. It identifies the group as **CloudFront-VPCOrigins-Service-SG**, with description **CloudFront configured Security Group**, in the pilot VPC `vpc-09afdab2ced554af7` and account `528301714999`. It shows zero inbound permission entries and one outbound entry. This independently identifies the source group referenced in the earlier ALB ingress change as the CloudFront-managed VPC-origin group; the current ALB inbound rule itself was not shown in this screenshot and remains the next read-only check. No rule was edited.

The developer then supplied the current **Inbound rules** screenshot for ALB security group `sg-0b915083597584494`. It shows exactly **one** permission entry: **HTTP/TCP 80**, sourced from `sg-050ef93b36cb160f1`, which the preceding screenshot identified as **CloudFront-VPCOrigins-Service-SG**. There is no visible broad CIDR or HTTPS/443 inbound rule. Together with the earlier screenshot establishing the ALB's internal scheme, this supports that the private ALB ingress is scoped to CloudFront's VPC-origin service group at the time of the check. The group's description still says “Public load balancer for TutorPair pilot,” a stale label from its earlier use; the visible rule and attached ALB configuration, not that description, determine access. No rule was edited.

The developer supplied the CloudFront Monitoring **Overview** screenshot for distribution `E34GZDTZ2HCOR1`, with the **1d** range and **UTC timezone** selected. The Requests chart shows traffic, including a brief peak around 102 requests per plotted interval; the error-rate chart shows several orange **4xxErrorRate** spikes and at least one green **5xxErrorRate** point near 100% early in the displayed period. The screenshot does not expose the point's exact timestamp, denominator, response path, or cause; an error-rate percentage can be high when request volume is low. The previously supplied current `/api/ready` response was successful, but it does not explain historical errors. Next hover the green 5xx point or use a read-only metric detail to identify its time and value before assessing whether follow-up is needed. No additional metrics were enabled and no setting changed.

The developer expanded the CloudFront **Error rate** graph to a one-day UTC view at five-minute granularity. The screenshot shows two green **5xxErrorRate** points at **100%** around midday UTC, then later visible green points at **0%**. It does not show a hover tooltip, exact timestamp, request count, URL path, or error cause. Those early points appear before the previously recorded API startup at 13:45:57 UTC if the chart covers the same November 11–12 period, but that timing relationship is an inference, not proof of cause. The successful current `/api/ready` response and healthy ECS target indicate the route worked during the later checks; they do not retroactively explain the 5xx points. No monitoring setting was changed.

The developer then supplied a CloudWatch metric tooltip for one **5xxErrorRate = 100%** point at **2026-11-11 13:25:00 UTC**. This point precedes the API stream's recorded startup at **13:45:57 UTC** by 20 minutes 57 seconds. The timing is consistent with a request during deployment setup, but the metric contains no request path, response body, request count, or root cause. The later visible metric points are at 0%, and the separate November 12 ECS/ALB and CloudFront readiness checks were healthy. No ongoing 5xx condition is established by these screenshots; no monitoring setting was changed.

## 2026-11-12 — Admin queue email layout fix prepared locally

**Performed by:** Codex in the local working tree. **AWS state:** No new deployment or resource change.

The admin queue screenshot repeatedly showed a contact email split awkwardly by `wordBreak: 'break-all'` inside a narrow two-column card. `AdminVerificationsPage.tsx` now lets the email occupy both columns, gives the card content a shrinkable width, and uses `overflowWrap: 'anywhere'` only when a long address needs wrapping. The change is presentation-only; no API, role, review, or document behavior was changed. The existing flat design styling remains in use.

A production `npm run build:client` passed with the recorded public pilot `VITE_*` values. The generated static files were packaged at `output/tutorpair-pilot-web-layout-20261112.zip`, with `index.html` and the `assets/` contents at the archive root; SHA-256 is `0F04EECF11E6DD3898FF59C447F63FAF3857C79AABD048C0B974B2B13DFDBA81`. The ZIP contains public frontend configuration only, not an AWS credential or database secret. It has **not** been uploaded to Amplify. A subsequent `npm test` attempt did not pass: 178 passed, 12 failed, 67 cancelled, 3 skipped, with local loopback `EACCES` errors; Docker Desktop's Linux engine was not available for the local PostgreSQL integration tests. This test run is not evidence of a frontend regression, but the suite is not green in this session. The last recorded successful full run remains 257 passed, 0 failed, 3 skipped. Before manual Amplify deployment, review the upload screen and ZIP selection; after deployment, visually verify the queue layout and existing pending status. The synthetic tutor must remain unapproved.

The developer chose to wait for a friend's additional fix and combine changes into one later manual Amplify deployment. The layout ZIP is a local intermediate artifact and must not be uploaded as the final combined build. After the friend's work is present in the local tree, review both changes together, rebuild the frontend with the public pilot variables, rerun `npm test` when local test services are available, create a fresh ZIP, and review the Amplify pre-submission screen. No deployment was started by this decision; the live frontend remains on its prior manual build.

## 2026-11-12 — Remaining AWS configuration reviewed

The developer asked whether more AWS configuration is necessary. Based on the latest observed ECS/ALB health, CloudFront readiness, RDS backup history, private S3 checks, and admin browser flow, no additional AWS resource change is established as a prerequisite to keep the currently verified pilot paths running through the professor review. The planned combined manual Amplify redeployment remains pending the friend's fix. SES remains sandboxed; the console test email reached Gmail Spam, and application email sending has not been demonstrated. Moving SES out of sandbox is relevant only if sending to unverified recipients is in scope, and the sender's deliverability still requires separate work. CloudWatch alerting and admin MFA hardening are not confirmed as configured. HA/failover and an RDS restore remain untested and would require a separate cost, security, and disruption review; neither is authorized by the current short-pilot checks. AWS Budgets remains deferred by developer choice, human Drizzle Studio review remains deferred, matching remains intentionally untested, and the November 19 teardown decision remains open. No AWS setting was changed during this assessment.

## 2026-11-12 — Seed contents reviewed; no database write

The developer asked whether a seeded database record in the project can be pushed. Codex inspected `apps/server/src/db/seed.ts` without running it. Its reference-data portion is the same subject/variant catalog already applied to pilot RDS and read-only counted as **24 subjects / 67 variants** on November 11; do not repeat that seed. The optional `SEED_MOCK_USERS=true` block contains sample tutors, students, reviews, and document metadata, including tutor profiles marked `APPROVED` and CV keys that are not established as real S3 documents. That block explicitly throws when `NODE_ENV=production`, and the prior ECS seed ran with `SEED_MOCK_USERS=false`. Pushing the mock block into the live pilot would bypass the current real-document verification workflow and contaminate matching/reviews with fictional identities; it must not be done by merely toggling a flag or rerunning the seed. The developer has not yet identified a specific record outside these two categories. No migration, seed, database write, or AWS deployment was performed for this review.

The developer asked whether application-triggered email will work. A read-only review confirms the deployed task was configured with `EMAIL_MODE=ses`, the dedicated verified pilot sender, and a task role carrying `ses:SendEmail` for that identity; the API startup stream reports the SES worker enabled. Source code polls email jobs and uses the AWS SES SDK. These configuration and code facts do not prove that an application notification has been sent through the running task. SES remains sandboxed in `ap-southeast-1`, so a notification addressed to an unverified recipient would be rejected; a verified recipient is eligible to receive an attempt, but runtime task-role use, worker processing, and inbox placement remain untested. The prior console email to the dedicated address reached Gmail Spam. No review decision, match confirmation, notification insertion, or email send was triggered during this assessment.

The developer asked whether the Google OAuth app must remain in **Testing** and whether test-user emails must be added manually. The recorded Google Auth Platform setup is **External / Testing** and lists only basic identity scopes (`openid`, `userinfo.email`, `userinfo.profile`); the frontend requests `openid`, `email`, and `profile` via Cognito. Google’s current [Manage App Audience](https://support.google.com/cloud/answer/15549945) guidance explicitly exempts requests limited to these basic identity scopes from the Testing test-user allowlist and seven-day authorization expiry. This corrects the earlier assumption that every Google sign-in requires manual test-user addition. The exception has **not** been verified with an unlisted account in the deployed Cognito flow; an organization’s Workspace policy can still block an app. If the exception applies live, the public frontend and backend first-login sync can create STUDENT or TUTOR users for unlisted Google accounts, while public ADMIN creation remains blocked. Therefore the Google test-user list must not be treated as a security boundary. Publishing to **In Production** would remove Testing status but is not needed merely to avoid manual email entry under the basic-scope exception; any such publishing change should be reviewed separately. No Google, Cognito, or database setting was changed during this assessment.

## 2026-11-12 — Pilot CloudWatch availability alarm created

**Performed by:** Human developer in the AWS console. **Evidence:** Developer-provided CloudWatch, SNS, alarm-preview, and alarm-details screenshots. Codex did not make an AWS API or console change.

The developer first viewed CloudWatch in N. Virginia, where the TutorPair log group was absent, then switched to `ap-southeast-1`. The existing `/ecs/tutorpair-pilot-api` log group showed Standard class, one-week retention, and six streams, including `api/api/`; this confirms the previously recorded ECS log setup. The Singapore alarm list initially showed **0 alarms**. The developer created SNS topic `tutorpair-pilot-alerts` with an email subscription for the pilot admin mailbox, and the SNS confirmation page explicitly showed **Subscription confirmed**. The address and subscription ID are omitted here.

The developer created CloudWatch metric alarm `tutorpair-pilot-api-no-healthy-targets` in `ap-southeast-1`. Its metric is `AWS/ApplicationELB` `HealthyHostCount` for target group `tutorpair-pilot-api-tg` and the active internal load balancer `tutorpair-pilot-api-int-alb`, not the earlier deleted public ALB. The statistic is **Minimum**, period **1 minute**, static threshold **< 1**, and evaluation **2 out of 2** datapoints. Missing data is treated as breaching. On entering ALARM, the action publishes to `tutorpair-pilot-alerts`; the details page shows **Actions enabled**. The alarm initially showed **Insufficient data** immediately after creation, then changed to **OK** at **2026-11-12 14:23:31 UTC** with the graph showing `HealthyHostCount = 1`. This establishes that the alarm exists and evaluated healthy at that time. An actual ALARM transition and notification email delivery have not been tested. No additional CPU, memory, 5xx, log metric-filter, or budget alarm is established by these screenshots; those are optional follow-up monitoring choices, not a prerequisite for this pilot's basic API health alert.

The developer then published a direct test message to the SNS topic and supplied a Gmail screenshot showing **TutorPair alert test** from AWS Notifications in the Inbox, with the expected test body. This verifies SNS-to-email delivery to the confirmed subscription. The screenshot contains an unsubscribe URL and subscription identifier, which are intentionally not reproduced here. Direct SNS publication does not test a CloudWatch **ALARM** state transition or prove the alarm action has fired; the alarm's configuration and OK evaluation are evidenced separately above.
