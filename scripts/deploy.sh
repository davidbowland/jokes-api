#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(./scripts/assumeDeveloperRole.sh)
fi

### Zips to S3

./scripts/copyZipsToS3.sh skipAssumeRole

### Infrastructure

cd infrastructure/

# Set up NVM
export NVM_DIR="$HOME/.nvm"
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm

# Remember current node version
CURRENT_NODE=$(node --version)

# We need Node 16 for infrastructure
nvm use v16

# Ensure dependencies are installed
NODE_ENV=production npm ci

# Use pulumi to deploy project
../scripts/infrastructure/deploy.sh

# Go back to Node version active when script ran
nvm use $CURRENT_NODE
