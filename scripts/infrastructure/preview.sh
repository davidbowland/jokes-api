#!/bin/sh

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(../scripts/assumeDeveloperRole.sh)
fi

### Preview infrastructure

# Lint to catch syntax issues
npm run lint

# Generate a preview of what will change
pulumi preview -s dev
