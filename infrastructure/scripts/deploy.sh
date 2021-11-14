#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### Infrastructure

# Use pulumi to deploy project
pulumi up -s dev

# Add new API URL to lambda environment variables
./scripts/setEnvironmentVariables.sh
