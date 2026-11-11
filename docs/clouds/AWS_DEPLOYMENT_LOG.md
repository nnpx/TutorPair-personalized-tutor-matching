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
