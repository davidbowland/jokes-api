#!/bin/sh

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(./scripts/assumeDeveloperRole.sh)
fi

### Zips to S3

./copyZipsToS3.sh skipAssumeRole

### Infrastructure

cd infrastructure/

# Remember current node version
CURRENT_NODE=$(node --version)

# We need Node 16 for infrastructure
nvm use v16

# Ensure dependencies are installed
NODE_ENV=production npm ci

# Use pulumi to deploy project
../scripts/infrastructure/deployInfrastructure.sh

# Go back to Node version active when script ran
nvm use $CURRENT_NODE
