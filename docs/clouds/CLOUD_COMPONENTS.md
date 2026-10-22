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
| AWS VPC | Provides the private networking environment for the backend and database resources. |
| Security Groups | Controls network traffic between the ALB, ECS Fargate, and RDS resources. |
| AWS IAM | Controls permissions for AWS services and the ECS application to access resources such as S3 and SES. |
| AWS Secrets Manager | Securely stores the PostgreSQL credentials and supplies them to the ECS task without placing passwords in source code or the Docker image. |

## Deployment details

This table establishes component scope and responsibilities. The accepted [availability decision](./HIGH_AVAILABILITY.md) keeps one codebase supporting one or multiple API instances. Regular deployment uses one task and Single-AZ RDS; HA testing uses at least two tasks across two AZs, Multi-AZ RDS, and resilient outbound connectivity. Implementation and failover verification are pending. Region, sizes, subnet layout, exact outbound solution, and monthly budget still require deployment planning. Private ECS/RDS remain the baseline; public ECS remains an unselected alternative.

NAT gateways or VPC endpoints are supporting network options to evaluate, not additional approved components inferred from this table. Do not add AMI management, a separately managed CloudFront distribution, or customer-managed KMS keys based on the superseded screenshots.

See [AWS_SETUP_PLAN.md](./AWS_SETUP_PLAN.md) for proposed deployment details and [AWS_ALIGNMENT_REVIEW.md](./AWS_ALIGNMENT_REVIEW.md) for repository implementation status.
