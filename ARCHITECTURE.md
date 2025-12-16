# CloudShrink Architecture

## Control plane
- **Frontend**: React TypeScript app hosted on S3 + CloudFront. Auth uses Amazon Cognito user pool + client; the app exchanges Cognito tokens for API calls.
- **API**: Amazon API Gateway HTTP API -> Lambda (`backend/lambdas/api_handler`) providing CRUD for accounts, policies, volumes, operations, and manual scan trigger.
- **Data**: DynamoDB tables store accounts, policies, inventory, and operation audit history.
- **Workflow**: Step Functions state machine (`statemachine/workflow.asl.json`) orchestrates snapshot, volume creation, LVM prep, migration, cleanup, and record updates. Failure handling keeps snapshots for recovery.
- **SSM documents**: packaged from `ssm_documents/` for discovery, preflight, migrate, and cleanup.
- **Eventing**: EventBridge schedule (every 6h) can invoke discovery + evaluation Lambdas to refresh inventory.
- **Notifications**: SNS topic can be wired for human alerts; UI polls `/operations` for updates.

## Satellite accounts
- Onboarding stack (`infrastructure/satellite/template.yaml`) creates `CloudShrinkSatelliteRole` with trust to the central account role and `sts:ExternalId` condition.
- EC2/SSM permissions are constrained to volumes tagged `cloudshrink_enable=true`.
- Discovery Lambda in the central account assumes this role to enumerate volumes and run SSM docs.

## Deployment
- GitHub Actions uses the OIDC role template in `infrastructure/github/oidc-role.yaml`. No long-lived secrets are stored; `aws-actions/configure-aws-credentials` assumes the deploy role.
- `make deploy` calls `scripts/deploy.sh` which performs CloudFormation deploy and S3 sync.

## Workflows
1. **Discovery**: scheduled or manual `POST /scan` triggers discovery Lambda -> Assume satellite role -> EC2 + SSM discovery -> Persist volume records.
2. **Evaluation**: evaluation Lambda reads policies and marks eligibility. Policy attributes include tags, buffer %, min/max sizes, cooldown, retention, and approval mode.
3. **Shrink execution**: API enqueue -> Step Functions acquires lock, runs preflight, snapshots, provisions new volume, LVM extend + pvmove, detaches old PV, updates records, and publishes notifications.

## Safety controls
- Snapshot before any destructive change.
- Locks via DynamoDB conditional updates to prevent concurrent operations.
- Root volumes excluded by discovery logic; only Linux LVM ext4 is supported.
- Role permissions are scoped to tagged resources.
