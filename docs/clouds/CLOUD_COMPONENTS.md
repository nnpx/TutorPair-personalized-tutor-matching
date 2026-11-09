# TutorPair Cloud Components

Agreed component list supplied directly by the user on 2026-10-22. This list supersedes the earlier Word document and embedded screenshots as the reference for cloud component scope.

| Component name | Description |
|---|---|
| AWS Amplify Hosting | Hosts and deploys the React frontend with managed HTTPS and CDN delivery. |
| Amazon Route 53 | Provides DNS and routes the application domain to the frontend and backend endpoints. |
| Application Load Balancer (ALB) | Receives HTTPS API requests and routes them to the ECS Fargate backend. |
| AWS Certificate Manager (ACM) | Provides the SSL/TLS certificate used by the ALB for secure HTTPS communication. |
| Amazon ECS Fargate | Runs the containerized Node.js/Express backend without requiring server management. |
| Amazon ECR | Stores Docker images used to deploy the Node.js/Express backend to Fargate. |
| Amazon RDS for PostgreSQL | Managed relational database storing TutorPair users, tutors, students, subjects, availability, matches, reviews, and notifications. |
| Amazon S3 | Stores tutor documents, CVs, supporting documents, and profile images. |
| Amazon Cognito | Provides user authentication and integrates Google OAuth 2.0 for login. |
| Amazon SES | Sends automated email notifications, such as notifying tutors when they are selected by students. |
| Amazon CloudWatch | Collects application/container logs and AWS metrics for monitoring and troubleshooting. |
| AWS VPC | Provides networking for the public ALB and ECS tasks and isolated private database resources. |
| Security Groups | Controls network traffic between the ALB, ECS Fargate, and RDS resources. |
| AWS IAM | Controls permissions for AWS services and the ECS application to access resources such as S3 and SES. |
| AWS Secrets Manager | Securely stores the PostgreSQL credentials and supplies them to the ECS task without placing passwords in source code or the Docker image. |

## Deployment details

This table establishes component scope and responsibilities. The accepted [availability decision](./HIGH_AVAILABILITY.md) keeps one codebase supporting one or multiple API instances. On 2026-11-09, the user selected public-subnet ECS tasks with public IPs for the deployment profiles; the ALB remains public and RDS remains private. Regular deployment uses one task and Single-AZ RDS; HA testing uses at least two tasks across two AZs and Multi-AZ RDS. Implementation and failover verification are pending. Singapore (`ap-southeast-1`) and a total budget of ฿4,000 through the professor review window ending 19 November 2026, including later charges, are recorded in [AWS_SETUP_PLAN.md](./AWS_SETUP_PLAN.md). Sizes, exact DNS names, and infrastructure tooling remain deployment details.

The selected public ECS layout gives tasks direct outbound access through an internet gateway and does not require a NAT gateway for those tasks. VPC endpoints remain optional supporting network choices, not additional approved components inferred from this table. Do not add AMI management, a separately managed CloudFront distribution, or customer-managed KMS keys based on the superseded screenshots.

See [AWS_SETUP_PLAN.md](./AWS_SETUP_PLAN.md) for proposed deployment details and [AWS_ALIGNMENT_REVIEW.md](./AWS_ALIGNMENT_REVIEW.md) for repository implementation status.
