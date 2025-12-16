#!/usr/bin/env bash
set -euo pipefail
: "${ACCOUNT_ID:?ACCOUNT_ID required}"
: "${REGION:?REGION required}"
: "${STACK_NAME:?STACK_NAME required}"

ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "Packaging backend..."
# In real pipeline we would package and upload artifacts to S3. Here we simply echo.

echo "Deploying central stack via CloudFormation"
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$ROOT/infrastructure/central/template.yaml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

echo "Syncing frontend"
aws s3 sync "$ROOT/frontend/dist" "s3://${ACCOUNT_ID}-${STACK_NAME}-frontend"
