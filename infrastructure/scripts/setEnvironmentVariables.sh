#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### API_URL

# Get API URL
API_URL=$(pulumi stack output -j -s dev | jq -r .apiUrl)

# Add API_URL environment variable
V1_JOKES_ARN=$(pulumi stack output -j -s dev | jq -r .lambdaV1JokesArn)
ENVIRONMENT_VARS=$(aws lambda get-function-configuration --function-name="$V1_JOKES_ARN" \
  | jq .Environment | jq ".Variables.API_URL=\"$API_URL\"")
aws lambda update-function-configuration --function-name="$V1_JOKES_ARN" --environment="$ENVIRONMENT_VARS" > /dev/null
