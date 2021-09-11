#!/bin/sh

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### Infrastructure

# Use pulumi to deploy project
pulumi up -s dev
