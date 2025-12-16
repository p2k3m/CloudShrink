# CloudShrink Security Notes

- **OIDC-only CI/CD**: Deployment uses GitHub Actions OIDC with the role defined in `infrastructure/github/oidc-role.yaml`. No access keys are stored in the repo or CI.
- **Satellite guardrails**: `CloudShrinkSatelliteRole` enforces `sts:ExternalId` and tags `cloudshrink_enable=true` on EC2 APIs to prevent accidental operations.
- **Snapshots before change**: Step Functions takes an EBS snapshot before any destructive work; snapshots are tagged for traceability.
- **Audit trail**: DynamoDB `Operations` table captures executions and statuses; State Machine + Lambda logs go to CloudWatch.
- **Least privilege**: IAM policies in central and satellite stacks limit actions to required services and tagged resources. No root volume modifications.
- **Secrets management**: No plaintext secrets in code; Cognito handles auth, and Lambda environment variables avoid sensitive data.
