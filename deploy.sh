#!/bin/bash
# ShadowLlama Deployment Script
set -e

SERVICE_NAME="shadowllama"
PROJECT_ID="${GCP_PROJECT_ID:-daydreams-labs-staging}"
REGION="${GCP_REGION:-us-central1}"

echo "🚀 Deploying ShadowLlama Agent"
echo "Service: $SERVICE_NAME"
echo "Project: $PROJECT_ID"

bun install

daydreams-deploy deploy \
  --name "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --file "server.ts" \
  --env ".env.production" \
  --memory "512Mi" \
  --max-instances "10" \
  --port "4021" \
  --domain "agent.daydreams.systems"

echo "✅ Deployed to https://${SERVICE_NAME}.agent.daydreams.systems"
