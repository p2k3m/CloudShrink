# CloudShrink

CloudShrink is a production-grade multi-account service that discovers opt-in EBS data volumes and performs safe shrink operations through LVM-aware SSM automation. This repository contains the control-plane frontend, backend Lambdas, Step Functions workflow, SSM documents, and infrastructure-as-code for both the central and satellite accounts.

## Repository layout
- `frontend/`: React + TypeScript dashboard built with Vite.
- `backend/`: Python Lambda handlers for the API, discovery, evaluation, and workflow trigger.
- `statemachine/`: Step Functions Amazon States Language definition implementing the shrink workflow.
- `ssm_documents/`: SSM documents for discovery and migration phases.
- `infrastructure/central`: CloudFormation template for the control plane (API Gateway, Cognito, DynamoDB, Step Functions, S3/CloudFront hosting).
- `infrastructure/satellite`: CloudFormation stack for satellite account onboarding role.
- `infrastructure/github`: OIDC deploy role template for GitHub Actions.
- `scripts/`: helper scripts for bootstrap and deploy.
- `.github/workflows`: CI/CD workflows.

## How to deploy (central account)
1. **Create the GitHub OIDC deploy role** in the central account using `infrastructure/github/oidc-role.yaml`. Supply `GitHubRepo` (e.g., `myorg/CloudShrink`) and optional `DeploymentRoleName`.
2. Configure GitHub repository **actions secrets/variables**: `AWS_REGION`, `AWS_ACCOUNT_ID`, `STACK_NAME` (e.g., `CloudShrink`), and `DEPLOY_ROLE_ARN` returned by the template.
3. Push to `main`. The `deploy.yml` workflow builds the frontend, packages Lambdas/state machine, and deploys the CloudFormation stack assuming the role via OIDC (no access keys stored).
4. For manual deploys run `make deploy` locally after exporting `ACCOUNT_ID`, `REGION`, and `STACK_NAME`; it leverages `scripts/deploy.sh` and never stores credentials.

## How to onboard a satellite account
1. Generate a unique **ExternalId**.
2. In the satellite account deploy `infrastructure/satellite/template.yaml` with parameters `ExternalId` and `CentralAccountId`.
3. Register the account + ExternalId in the control-plane UI (`Accounts`), which is stored in DynamoDB and used by the discovery Lambda to assume the role.

## How to enable a volume
1. Tag the data volume (non-root) with `cloudshrink_enable=true` in the satellite account.
2. Ensure the instance is managed by SSM and uses LVM with ext4.
3. CloudShrink discovery and evaluation will surface the volume as **eligible**; trigger shrink from the UI or via `POST /operations`.

## Safety & limitations
- Every destructive step is preceded by an EBS snapshot and operation trail in DynamoDB.
- Root volumes are intentionally excluded.
- Only Linux + LVM + ext4 data volumes are supported in the MVP.
- Cross-account actions are constrained by the satellite role and volume tag condition `cloudshrink_enable=true`.
- Deployment and automation rely solely on OIDC assume-role; **never use access keys**.

## Local development
- `make dev`: start the Vite dev server for the dashboard (requires Node 18+).
- `make test`: lightweight linters/compilation for frontend and backend stubs.

See `ARCHITECTURE.md` and `SECURITY.md` for deeper design details.
